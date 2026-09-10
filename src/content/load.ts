import { defaultLocale, isLocale, locales, type Locale } from "@/config/locales";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { blocksToText, citedSourceIds, parseMarkdown } from "@/content/markdown";
import { getAuthor } from "@/content/authors";
import { getSection } from "@/content/sections";
import {
  PUBLIC_STATUSES,
  type Article,
  type ArticleSchemaType,
  type ArticleStatus,
  type ImageAsset,
  type RelatedLogisticIDEntity,
  type Source,
  type UpdateRecord,
} from "@/content/types";

/**
 * Loading and validating the article corpus.
 *
 * Every rule here is a build failure, not a warning. A published article that
 * breaks one of them does not render with a missing piece — the build stops,
 * because the failure modes this guards against (a broken canonical, a
 * citation pointing at a source that does not exist, an unattributed image)
 * are all invisible on the page and expensive once indexed.
 *
 * ## Why the frontmatter is JSON
 *
 * Article files carry a JSON object between `---` fences rather than YAML.
 * YAML would need a parser: either a dependency whose behaviour on odd input
 * is another thing to audit, or a hand-written subset whose bugs would be
 * silent — a mistyped nested key parsed as a string still "works", and the
 * article publishes with a missing licence. `JSON.parse` has one unambiguous
 * grammar, fails loudly, and needs nothing installed.
 */

const CONTENT_DIR = join(process.cwd(), "content", "articles");
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

/** Words per minute used to estimate reading time. */
const READING_SPEED = 220;

export class ContentError extends Error {}

function bad(file: string, message: string): never {
  throw new ContentError(`${file}: ${message}`);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function str(file: string, raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  if (typeof value !== "string" || value.trim() === "") {
    bad(file, `"${key}" is required and must be a non-empty string`);
  }
  return value.trim();
}

function optionalStr(file: string, raw: Record<string, unknown>, key: string): string | undefined {
  const value = raw[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    bad(file, `"${key}", when present, must be a non-empty string`);
  }
  return value.trim();
}

function strArray(file: string, raw: Record<string, unknown>, key: string): string[] {
  const value = raw[key];
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    bad(file, `"${key}" must be an array of strings`);
  }
  return value as string[];
}

/* ------------------------------------------------------------------ */
/* Nested records                                                      */
/* ------------------------------------------------------------------ */

function parseSource(file: string, raw: unknown, index: number): Source {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    bad(file, `sources[${index}] must be an object`);
  }
  const record = raw as Record<string, unknown>;
  const where = `sources[${index}]`;

  const id = str(file, record, "id");
  if (!SLUG.test(id)) bad(file, `${where}.id must be a lowercase hyphenated slug (got "${id}")`);

  const accessedAt = record["accessedAt"];
  if (!isIsoDate(accessedAt)) {
    bad(file, `${where}.accessedAt must be a real YYYY-MM-DD date on which the source was actually consulted`);
  }

  const url = optionalStr(file, record, "url");
  if (url !== undefined) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      bad(file, `${where}.url is not a valid absolute URL: ${url}`);
    }
    if (parsed.protocol !== "https:") {
      bad(file, `${where}.url must use https (got ${parsed.protocol})`);
    }
  }

  const date = record["date"];
  if (date !== undefined && !isIsoDate(date)) {
    bad(file, `${where}.date must be a YYYY-MM-DD date`);
  }

  const sourceType = str(file, record, "sourceType");
  const allowedTypes = [
    "legislation",
    "official-guidance",
    "statistics",
    "research-paper",
    "institutional-report",
    "standard",
    "technical-documentation",
    "company-announcement",
    "news",
  ];
  if (!allowedTypes.includes(sourceType)) {
    bad(file, `${where}.sourceType "${sourceType}" is not one of ${allowedTypes.join(", ")}`);
  }

  return {
    id,
    title: str(file, record, "title"),
    authorsOrOrganization: str(file, record, "authorsOrOrganization"),
    ...(optionalStr(file, record, "publication") === undefined
      ? {}
      : { publication: optionalStr(file, record, "publication") as string }),
    ...(date === undefined ? {} : { date: date as string }),
    ...(url === undefined ? {} : { url }),
    ...(optionalStr(file, record, "doi") === undefined
      ? {}
      : { doi: optionalStr(file, record, "doi") as string }),
    ...(optionalStr(file, record, "reportNumber") === undefined
      ? {}
      : { reportNumber: optionalStr(file, record, "reportNumber") as string }),
    sourceType: sourceType as Source["sourceType"],
    accessedAt,
    ...(record["fullTextConsulted"] === false ? { fullTextConsulted: false as const } : {}),
  };
}

function parseHeroImage(file: string, raw: unknown): ImageAsset {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    bad(file, "heroImage must be an object");
  }
  const record = raw as Record<string, unknown>;

  const width = record["width"];
  const height = record["height"];
  if (typeof width !== "number" || typeof height !== "number" || width <= 0 || height <= 0) {
    bad(file, "heroImage.width and heroImage.height are required positive numbers, so the layout can reserve space and the image cannot shift it");
  }

  return {
    src: str(file, record, "src"),
    alt: str(file, record, "alt"),
    width,
    height,
    source: str(file, record, "source"),
    creator: str(file, record, "creator"),
    license: str(file, record, "license"),
    ...(optionalStr(file, record, "sourceUrl") === undefined
      ? {}
      : { sourceUrl: optionalStr(file, record, "sourceUrl") as string }),
    credit: str(file, record, "credit"),
    ...(record["illustrative"] === true ? { illustrative: true } : {}),
  };
}

const SERVICE_SLUGS = ["ftl", "ltl", "express", "pallets"];
const AUDIENCE_SLUGS = ["shippers", "carriers"];

function parseRelated(file: string, raw: unknown, index: number): RelatedLogisticIDEntity {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    bad(file, `relatedLogisticID[${index}] must be an object`);
  }
  const record = raw as Record<string, unknown>;
  const type = str(file, record, "type");

  if (type === "service") {
    const slug = str(file, record, "slug");
    if (!SERVICE_SLUGS.includes(slug)) {
      bad(file, `relatedLogisticID[${index}].slug "${slug}" is not a LogisticID service (${SERVICE_SLUGS.join(", ")})`);
    }
    return { type: "service", slug: slug as "ftl" | "ltl" | "express" | "pallets" };
  }
  if (type === "audience") {
    const slug = str(file, record, "slug");
    if (!AUDIENCE_SLUGS.includes(slug)) {
      bad(file, `relatedLogisticID[${index}].slug "${slug}" is not a LogisticID audience (${AUDIENCE_SLUGS.join(", ")})`);
    }
    return { type: "audience", slug: slug as "shippers" | "carriers" };
  }
  if (type === "page") {
    const path = str(file, record, "path");
    if (!path.startsWith("/")) {
      bad(file, `relatedLogisticID[${index}].path must be a site-relative path beginning with "/"`);
    }
    return { type: "page", path };
  }

  return bad(file, `relatedLogisticID[${index}].type "${type}" is not one of service, audience, page`);
}

function parseUpdate(file: string, raw: unknown, index: number): UpdateRecord {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    bad(file, `updateHistory[${index}] must be an object`);
  }
  const record = raw as Record<string, unknown>;
  const date = record["date"];
  if (!isIsoDate(date)) bad(file, `updateHistory[${index}].date must be a YYYY-MM-DD date`);
  return { date, note: str(file, record, "note") };
}

/* ------------------------------------------------------------------ */
/* Article parsing                                                     */
/* ------------------------------------------------------------------ */

const STATUSES: ArticleStatus[] = [
  "DRAFT",
  "REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "UPDATED",
  "ARCHIVED",
];

export function parseArticleFile(file: string, contents: string, today: string): Article {
  const match = FRONTMATTER.exec(contents.replace(/^﻿/, ""));
  if (match?.[1] === undefined || match[2] === undefined) {
    bad(file, "missing frontmatter: the file must begin with a JSON object between --- fences");
  }

  let raw: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(match[1]);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      bad(file, "frontmatter must be a JSON object");
    }
    raw = parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ContentError) throw error;
    bad(file, `frontmatter is not valid JSON: ${(error as Error).message}`);
  }

  const slug = str(file, raw, "slug");
  if (!SLUG.test(slug)) bad(file, `slug must be lowercase and hyphenated (got "${slug}")`);
  if (/\d{4}/.test(slug)) {
    bad(file, `slug "${slug}" contains a year. Article URLs are durable and carry no date — the date is metadata, and putting it in the path makes an updated article look stale forever.`);
  }

  const section = str(file, raw, "section");
  if (getSection(section) === undefined) {
    bad(file, `section "${section}" is not a registered section`);
  }

  /**
   * The language, defaulting to English.
   *
   * A default rather than a required field, so that every article written
   * before the Magazine had a second language keeps its meaning without being
   * edited — and so that adding a locale never requires touching the corpus.
   */
  const localeRaw = raw["locale"];
  if (localeRaw !== undefined && (typeof localeRaw !== "string" || !isLocale(localeRaw))) {
    bad(file, `locale must be one of ${locales.join(", ")} (got ${JSON.stringify(localeRaw)})`);
  }
  const locale: Locale = localeRaw === undefined ? defaultLocale : (localeRaw as Locale);

  const translationOf = optionalStr(file, raw, "translationOf");
  if (translationOf !== undefined && locale === defaultLocale) {
    bad(
      file,
      `translationOf is set on a ${defaultLocale} article. The pairing is recorded on the translation, once, so that one edge cannot be declared twice and disagree with itself.`,
    );
  }

  const status = str(file, raw, "status");
  if (!STATUSES.includes(status as ArticleStatus)) {
    bad(file, `status "${status}" is not one of ${STATUSES.join(", ")}`);
  }

  const schemaType = str(file, raw, "schemaType");
  if (schemaType !== "Article" && schemaType !== "NewsArticle") {
    bad(file, `schemaType must be "Article" or "NewsArticle" (got "${schemaType}")`);
  }

  const datePublished = raw["datePublished"];
  if (!isIsoDate(datePublished)) {
    bad(file, "datePublished must be a real YYYY-MM-DD date");
  }

  const dateModified = raw["dateModified"];
  if (dateModified !== undefined && !isIsoDate(dateModified)) {
    bad(file, "dateModified, when present, must be a YYYY-MM-DD date");
  }
  if (typeof dateModified === "string" && dateModified < datePublished) {
    bad(file, `dateModified (${dateModified}) is before datePublished (${datePublished})`);
  }

  const authorSlugs = strArray(file, raw, "authors");
  if (authorSlugs.length === 0) bad(file, "authors must list at least one byline");
  for (const author of authorSlugs) {
    if (getAuthor(author) === undefined) {
      bad(file, `author "${author}" is not a registered byline. Bylines are added in src/content/authors.ts, and only for real, verified people.`);
    }
  }

  const rawSources = raw["sources"];
  if (rawSources !== undefined && !Array.isArray(rawSources)) {
    bad(file, "sources must be an array");
  }
  const sources = ((rawSources ?? []) as unknown[]).map((entry, index) =>
    parseSource(file, entry, index),
  );

  const seenSourceIds = new Set<string>();
  for (const source of sources) {
    if (seenSourceIds.has(source.id)) {
      bad(file, `duplicate citation id "${source.id}": a citation must resolve to exactly one source`);
    }
    seenSourceIds.add(source.id);
  }

  const rawRelated = raw["relatedLogisticID"];
  if (rawRelated !== undefined && !Array.isArray(rawRelated)) {
    bad(file, "relatedLogisticID must be an array");
  }
  const relatedLogisticID = ((rawRelated ?? []) as unknown[]).map((entry, index) =>
    parseRelated(file, entry, index),
  );

  const rawUpdates = raw["updateHistory"];
  if (rawUpdates !== undefined && !Array.isArray(rawUpdates)) {
    bad(file, "updateHistory must be an array");
  }
  const updateHistory = ((rawUpdates ?? []) as unknown[]).map((entry, index) =>
    parseUpdate(file, entry, index),
  );

  const body = parseMarkdown(match[2]);
  if (body.length === 0) bad(file, "the article has no body");

  // Every [^id] in the body must resolve to a listed source, and every listed
  // source must be cited. The first rule stops a reference dangling; the
  // second stops a bibliography of sources the article never actually used,
  // which is a way of borrowing authority without doing the work.
  const cited = citedSourceIds(body);
  for (const id of cited) {
    if (!seenSourceIds.has(id)) {
      bad(file, `the body cites [^${id}] but no source with that id is listed`);
    }
  }
  for (const source of sources) {
    if (!cited.includes(source.id)) {
      bad(file, `source "${source.id}" is listed but never cited in the body`);
    }
  }

  const text = blocksToText(body);
  const words = text.split(/\s+/).filter(Boolean).length;

  const article: Article = {
    id: str(file, raw, "id"),
    slug,
    section,
    locale,
    ...(translationOf === undefined ? {} : { translationOf }),
    title: str(file, raw, "title"),
    subtitle: str(file, raw, "subtitle"),
    description: str(file, raw, "description"),
    tags: strArray(file, raw, "tags"),
    authors: authorSlugs,
    datePublished,
    ...(dateModified === undefined ? {} : { dateModified: dateModified as string }),
    status: status as ArticleStatus,
    featured: raw["featured"] === true,
    ...(raw["heroImage"] === undefined ? {} : { heroImage: parseHeroImage(file, raw["heroImage"]) }),
    readingTime: Math.max(1, Math.round(words / READING_SPEED)),
    summary: str(file, raw, "summary"),
    body,
    sources,
    relatedLogisticID,
    relatedArticles: strArray(file, raw, "relatedArticles"),
    ...(optionalStr(file, raw, "seoTitle") === undefined
      ? {}
      : { seoTitle: optionalStr(file, raw, "seoTitle") as string }),
    ...(optionalStr(file, raw, "seoDescription") === undefined
      ? {}
      : { seoDescription: optionalStr(file, raw, "seoDescription") as string }),
    ...(optionalStr(file, raw, "socialTitle") === undefined
      ? {}
      : { socialTitle: optionalStr(file, raw, "socialTitle") as string }),
    ...(optionalStr(file, raw, "socialDescription") === undefined
      ? {}
      : { socialDescription: optionalStr(file, raw, "socialDescription") as string }),
    schemaType: schemaType as ArticleSchemaType,
    updateHistory,
    ...(optionalStr(file, raw, "correctionNote") === undefined
      ? {}
      : { correctionNote: optionalStr(file, raw, "correctionNote") as string }),
    ...(optionalStr(file, raw, "jurisdiction") === undefined
      ? {}
      : { jurisdiction: optionalStr(file, raw, "jurisdiction") as string }),
    ...(raw["informationCurrentAsOf"] === undefined
      ? {}
      : { informationCurrentAsOf: (() => {
          const value = raw["informationCurrentAsOf"];
          if (!isIsoDate(value)) bad(file, "informationCurrentAsOf must be a YYYY-MM-DD date");
          return value;
        })() }),
  };

  // A future publication date on a PUBLISHED article is either a typo or an
  // attempt to look fresher than the work is. Either way the page would carry
  // a date that has not happened.
  if (
    (PUBLIC_STATUSES as readonly string[]).includes(article.status) &&
    article.datePublished > today
  ) {
    bad(file, `datePublished ${article.datePublished} is in the future but the article is ${article.status}`);
  }

  if (article.status === "UPDATED" && article.dateModified === undefined) {
    bad(file, 'status is UPDATED but no dateModified is set: an update the reader cannot date is not an update they can act on');
  }

  if (article.correctionNote !== undefined && article.updateHistory.length === 0) {
    bad(file, "a correction must also appear in updateHistory, so the record of what changed is dated");
  }

  return article;
}

/** Read and validate every article file in the content directory. */
export function loadArticles(today = new Date().toISOString().slice(0, 10)): Article[] {
  const files = readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort();

  const articles = files.map((name) =>
    parseArticleFile(name, readFileSync(join(CONTENT_DIR, name), "utf8"), today),
  );

  validateCorpus(articles);
  return articles;
}

/** Rules that can only be checked once the whole corpus is known. */
export function validateCorpus(articles: readonly Article[]): void {
  const byId = new Map<string, Article>();
  const byUrl = new Map<string, Article>();

  for (const article of articles) {
    if (byId.has(article.id)) {
      throw new ContentError(`duplicate article id "${article.id}"`);
    }
    byId.set(article.id, article);

    const url = `/${article.section}/${article.slug}`;
    const existing = byUrl.get(url);
    if (existing !== undefined) {
      throw new ContentError(
        `duplicate public URL ${url}: used by both "${existing.id}" and "${article.id}"`,
      );
    }
    byUrl.set(url, article);
  }

  for (const article of articles) {
    for (const related of article.relatedArticles) {
      if (!byId.has(related)) {
        throw new ContentError(
          `"${article.id}" lists relatedArticles entry "${related}", which is not an article`,
        );
      }
      if (related === article.id) {
        throw new ContentError(`"${article.id}" lists itself as a related article`);
      }
      const target = byId.get(related);
      if (target !== undefined && !(PUBLIC_STATUSES as readonly string[]).includes(target.status)) {
        throw new ContentError(
          `"${article.id}" links to "${related}", which is ${target.status} and therefore not public`,
        );
      }
    }
  }

  // A section with no published articles would be an indexable page promising
  // coverage that does not exist.
  const publishedSections = new Set(
    articles
      .filter((article) => (PUBLIC_STATUSES as readonly string[]).includes(article.status))
      .map((article) => article.section),
  );
  for (const section of new Set(articles.map((a) => a.section))) {
    if (!publishedSections.has(section)) {
      throw new ContentError(`section "${section}" has no published articles`);
    }
  }

  /* ---- localization ---- */

  /**
   * Translation pairing has to be 1:1 and has to point at something real.
   *
   * A `translationOf` naming a missing article would emit an `hreflang`
   * cluster pointing at a URL that does not exist, and two German articles
   * claiming the same English source would emit two clusters that disagree
   * about which is the German version. Both fail the build here rather than
   * shipping to a crawler.
   */
  const translations = new Map<string, Article>();
  for (const article of articles) {
    if (article.translationOf === undefined) continue;
    const source = byId.get(article.translationOf);
    if (source === undefined) {
      throw new ContentError(
        `article "${article.id}" is a translation of "${article.translationOf}", which does not exist`,
      );
    }
    if (source.locale === article.locale) {
      throw new ContentError(
        `article "${article.id}" declares itself a translation of "${source.id}", which is in the same language`,
      );
    }
    const key = `${article.translationOf}:${article.locale}`;
    const existing = translations.get(key);
    if (existing !== undefined) {
      throw new ContentError(
        `"${existing.id}" and "${article.id}" both claim to be the ${article.locale} translation of "${article.translationOf}"`,
      );
    }
    translations.set(key, article);
  }
}

/** Only the articles a reader may see. */
export function publishedArticles(articles: readonly Article[]): Article[] {
  return articles
    .filter((article) => (PUBLIC_STATUSES as readonly string[]).includes(article.status))
    .sort((a, b) => {
      const byDate = b.datePublished.localeCompare(a.datePublished);
      return byDate !== 0 ? byDate : a.title.localeCompare(b.title);
    });
}
