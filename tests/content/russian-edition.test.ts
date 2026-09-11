import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { defaultLocale, localeDetails, locales } from "@/config/locales";
import { uiStrings } from "@/config/ui-strings";
import { authorLabels, authors } from "@/content/authors";
import { loadArticles, publishedArticles } from "@/content/load";
import { blocksToText, headingId } from "@/content/markdown";
import { getSection, sectionLabels, sections } from "@/content/sections";
import type { Article } from "@/content/types";
import { articleJsonLd } from "@/lib/jsonld";
import { atomFeed, jsonFeed, rssFeed, articleUrl } from "@/lib/feeds";
import {
  articlePath,
  authorPath,
  magazineStaticRoutes,
  staticPath,
  type MagazineStaticRoute,
} from "@/lib/localized-routes";
import { buildSearchIndex } from "@/lib/search";
import { magazineUrl, sharedImageUrl } from "@/lib/site";

/**
 * The Russian edition of the Magazine.
 *
 * Same shape and same intent as `german-edition.test.ts`: these guard the
 * EDITION — that it is complete, that every surface a Russian reader can reach
 * is Russian, and that nothing describes a Russian page in another language to
 * a machine. None of it can tell whether the Russian reads well; that needs a
 * native-level Russian speaker with freight knowledge, and no such review has
 * taken place.
 */

const corpus = publishedArticles(loadArticles());
const english = corpus.filter((article) => article.locale === "en");
const russian = corpus.filter((article) => article.locale === "ru");

describe("the suite examines the corpus it claims to", () => {
  it("found Russian articles by reading the content directory", () => {
    const files = readdirSync(join(process.cwd(), "content", "articles")).filter((name) =>
      name.endsWith(".md"),
    );
    expect(files.length).toBeGreaterThan(0);
    expect(corpus.length).toBe(files.length);
    expect(russian.length).toBeGreaterThan(0);
  });
});

describe("article parity", () => {
  it("every English article has a Russian translation", () => {
    const missing = english.filter(
      (article) => !russian.some((translation) => translation.translationOf === article.id),
    );
    expect(missing.map((a) => a.id)).toEqual([]);
    expect(russian.length).toBe(english.length);
  });

  it("gives every Russian article its own slug under /ru", () => {
    for (const article of russian) {
      const source = english.find((candidate) => candidate.id === article.translationOf) as Article;
      expect(source, article.id).toBeDefined();
      expect(article.slug, article.id).not.toBe(source.slug);
      expect(articlePath(article), article.id).toBe(`/ru/${article.section}/${article.slug}`);
      /* Lowercase ASCII, hyphenated, no Cyrillic: a slug is an address. */
      expect(article.slug, article.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(article.slug, article.id).not.toMatch(/[А-Яа-яЁё]/);
    }
  });

  it("keeps the related-reading graph inside Russian", () => {
    for (const article of russian) {
      for (const related of article.relatedArticles) {
        const target = corpus.find((candidate) => candidate.id === related);
        expect(target, `${article.id} → ${related}`).toBeDefined();
        expect((target as Article).locale, `${article.id} → ${related}`).toBe("ru");
      }
    }
  });
});

describe("article identity in structured data", () => {
  it("declares Russian, at the Russian URL, with the Russian headline", () => {
    for (const article of russian) {
      const node = articleJsonLd(article);
      const canonical = magazineUrl(articlePath(article)).href;
      expect(node["inLanguage"], article.id).toBe("ru");
      expect(node["url"], article.id).toBe(canonical);
      expect((node["mainEntityOfPage"] as Record<string, unknown>)["@id"], article.id).toBe(canonical);
      expect(node["headline"], article.id).toBe(article.title);
      expect(node["articleSection"], article.id).toBe(
        sectionLabels(getSection(article.section) as NonNullable<ReturnType<typeof getSection>>, "ru").name,
      );
      const image = node["image"] as Record<string, unknown> | undefined;
      if (image !== undefined) {
        expect(image["url"], article.id).toBe(
          sharedImageUrl((article.heroImage as { src: string }).src).href,
        );
        expect(String(image["url"]), article.id).not.toContain("/magazine/images/");
      }
    }
  });

  it("never emits another language's URL for a Russian article", () => {
    const otherPaths = corpus
      .filter((article) => article.locale !== "ru")
      .map((article) => `/magazine${articlePath(article)}`);
    for (const article of russian) {
      const serialised = JSON.stringify(articleJsonLd(article));
      for (const path of otherPaths) {
        expect(serialised.includes(path), `${article.id} names ${path}`).toBe(false);
      }
    }
  });
});

describe("the Russian surfaces a reader can reach", () => {
  it("gives every static route a Russian path under /ru", () => {
    for (const key of Object.keys(magazineStaticRoutes) as MagazineStaticRoute[]) {
      const path = staticPath(key, "ru");
      expect(path, key).toMatch(/^\/ru(\/|$)/);
      expect(path, key).not.toMatch(/[А-Яа-яЁё]/);
      expect(path, key).toBe(path.toLowerCase());
    }
  });

  it("has a route file behind every Russian static route", () => {
    const appDir = join(process.cwd(), "src", "app", "(ru)");
    const present = new Set<string>();
    const walk = (dir: string, prefix: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          walk(join(dir, entry.name), entry.name.startsWith("(") ? prefix : `${prefix}/${entry.name}`);
        } else if (entry.name === "page.tsx" || entry.name === "route.ts") {
          present.add(prefix === "" ? "/" : prefix);
        }
      }
    };
    walk(appDir, "");
    for (const key of Object.keys(magazineStaticRoutes) as MagazineStaticRoute[]) {
      expect(present.has(staticPath(key, "ru")), `${key} → ${staticPath(key, "ru")}`).toBe(true);
    }
  });

  it("names every section and every byline in Russian, distinctly", () => {
    for (const section of sections) {
      const ru = sectionLabels(section, "ru");
      expect(ru.name, section.slug).toMatch(/[А-Яа-яЁё]/);
      expect(ru.name, section.slug).not.toBe(sectionLabels(section, "en").name);
      expect(ru.name, section.slug).not.toBe(sectionLabels(section, "de").name);
    }
    for (const author of authors) {
      const ru = authorLabels(author, "ru");
      expect(ru.name, author.slug).toMatch(/[А-Яа-яЁё]/);
      expect(ru.bio, author.slug).not.toBe(authorLabels(author, "en").bio);
    }
  });
});

describe("the interface dictionary", () => {
  const SAME_IN_BOTH = new Set(["readInEnglishNote", "jsonFeed"]);

  it("has no Russian value left at its English wording", () => {
    const untranslated: string[] = [];
    for (const [key, value] of Object.entries(uiStrings.ru)) {
      if (SAME_IN_BOTH.has(key)) continue;
      const englishValue = (uiStrings.en as Record<string, unknown>)[key];
      if (typeof value === "string" && value === englishValue && value !== "") untranslated.push(key);
      if (typeof value === "object" && value !== null) {
        for (const [inner, innerValue] of Object.entries(value as Record<string, string>)) {
          if (innerValue === (englishValue as Record<string, string>)[inner]) {
            untranslated.push(`${key}.${inner}`);
          }
        }
      }
    }
    expect(untranslated).toEqual([]);
  });

  it("uses Russian quotation marks and lowercase вы", () => {
    for (const [key, value] of Object.entries(uiStrings.ru)) {
      if (typeof value !== "string") continue;
      expect(value.includes("“") || value.includes("”"), `${key}: ${value}`).toBe(false);
      expect((value.match(/«/g) ?? []).length, `${key}: ${value}`).toBe(
        (value.match(/»/g) ?? []).length,
      );
      for (const sentence of value.split(/(?<=[.!?])\s+/)) {
        const words = sentence.trim().split(/\s+/);
        for (const [index, word] of words.entries()) {
          if (index === 0) continue;
          expect(
            /^(Вы|Вас|Вам|Вами|Ваш|Ваша|Ваше|Ваши|Вашего|Вашей|Вашим|Ваших|Вашему|Вашу)(?!\p{L})/u.test(
              word.replace(/^[«("']+/, ""),
            ),
            `${key}: ${word}`,
          ).toBe(false);
        }
      }
    }
  });
});

describe("Russian prose and typography", () => {
  const text = (article: Article) =>
    [article.title, article.subtitle, article.description, article.summary, blocksToText(article.body)].join(" ");

  it("uses « » and no ASCII or English quotation mark", () => {
    for (const article of russian) {
      const value = text(article);
      expect(value.includes('"'), article.id).toBe(false);
      expect(value.includes("“") || value.includes("”"), article.id).toBe(false);
      expect((value.match(/«/g) ?? []).length, article.id).toBe((value.match(/»/g) ?? []).length);
    }
  });

  it("gives every Russian heading its own readable fragment id", () => {
    /*
     * WITHOUT CYRILLIC TRANSLITERATION EVERY RUSSIAN HEADING GETS THE SAME ID.
     * `headingId` maps anything outside `[a-z0-9]` to a hyphen, so a wholly
     * Cyrillic heading used to reduce to nothing and fall through to the
     * `"section"` fallback — one id shared by every heading on every Russian
     * article, every in-page anchor landing on the first, and invalid HTML.
     * The duplicate-id check in the parser caught it on the first article.
     */
    expect(headingId("Что на самом деле считают")).toBe("chto-na-samom-dele-schitayut");
    for (const article of russian) {
      const ids = article.body
        .filter((block): block is Extract<typeof block, { kind: "heading" }> => block.kind === "heading")
        .map((block) => block.id);
      expect(ids.length, article.id).toBeGreaterThan(0);
      expect(new Set(ids).size, article.id).toBe(ids.length);
      for (const id of ids) {
        expect(id, article.id).not.toBe("section");
        expect(id, article.id).toMatch(/^[a-z0-9-]+$/);
      }
    }
  });

  it("never makes LogisticID the carrier", () => {
    /*
     * The clause, not the sentence, and not split on the em dash — in Russian
     * the dash is the copula, so splitting on it would tear «LogisticID —
     * перевозчик» in half. Unicode lookarounds, because `\b` is ASCII-only and
     * would match nothing at all against Cyrillic.
     */
    for (const article of russian) {
      for (const sentence of text(article).split(/(?<=[.!?])\s+/)) {
        if (!/LogisticID/.test(sentence)) continue;
        for (const clause of sentence.split(/[,;:]|\sи\s/)) {
          if (!/LogisticID/.test(clause)) continue;
          expect(/LogisticID[^.]{0,40}(это\s+)?перевозчик/.test(clause), clause).toBe(false);
          expect(
            /LogisticID[^.]{0,60}(?<!\p{L})(перевозит|везёт|везет|доставляет)(?!\p{L})/u.test(clause),
            clause,
          ).toBe(false);
        }
      }
    }
  });

  it("claims no ownership, guarantee or market the English article does not", () => {
    const forbidden = [
      /наш автопарк/i, /наши машины/i, /наши грузовики/i, /наши склады/i, /наши терминалы/i,
      /гарантируем/i, /круглосуточно/i, /по всему миру/i,
      /ООО LogisticID/, /(?<!\p{L})ИНН(?!\p{L})/u, /(?<!\p{L})ОГРН(?!\p{L})/u,
      /обслуживаем Россию/i, /по СНГ/i, /(?<!\p{L})ЕАЭС(?!\p{L})/u,
    ];
    for (const article of russian) {
      for (const pattern of forbidden) {
        expect(pattern.test(text(article)), `${article.id}: ${pattern}`).toBe(false);
      }
    }
  });

  it("publishes no e-mail address but the company's own", () => {
    for (const article of russian) {
      for (const address of text(article).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) ?? []) {
        expect(address, article.id).toBe("contact@logisticid.com");
      }
    }
  });
});

describe("source parity", () => {
  it("reproduces every source exactly, and every figure digit for digit", () => {
    for (const article of russian) {
      const source = english.find((candidate) => candidate.id === article.translationOf) as Article;
      expect(article.sources.map((s) => s.id), article.id).toEqual(source.sources.map((s) => s.id));
      for (const [index, cited] of article.sources.entries()) {
        const original = source.sources[index] as NonNullable<(typeof source.sources)[number]>;
        /*
         * A SOURCE IS EVIDENCE, NOT PROSE. Title, issuing body, publication,
         * URL, access date and kind are reproduced exactly. A translated source
         * title is a title nobody published.
         */
        expect(cited.title, cited.id).toBe(original.title);
        expect(cited.authorsOrOrganization, cited.id).toBe(original.authorsOrOrganization);
        expect(cited.publication, cited.id).toBe(original.publication);
        expect(cited.url, cited.id).toBe(original.url);
        expect(cited.accessedAt, cited.id).toBe(original.accessedAt);
      }
      /*
       * Every digit sequence in the English body appears in the Russian one.
       * Separators are localised; the digits are not, and a figure that lost a
       * digit in translation would be a fabricated figure.
       */
      const digitsOf = (value: string) =>
        (value.match(/\d[\d  ,.]*\d|\d/g) ?? []).map((run) => run.replace(/\D/g, ""));
      const englishDigits = digitsOf(blocksToText(source.body));
      const russianDigits = new Set(digitsOf(blocksToText(article.body)));
      for (const run of englishDigits) {
        expect(russianDigits.has(run), `${article.id}: lost the figure ${run}`).toBe(true);
      }
    }
  });
});

describe("feeds and the search index", () => {
  it("puts only Russian articles, at Russian URLs, in the Russian feeds", () => {
    const rss = rssFeed(russian, "ru");
    const atom = atomFeed(russian, "1970-01-01T00:00:00Z", "ru");
    const json = JSON.stringify(jsonFeed(russian, "ru"));
    expect(rss).toContain("<language>ru</language>");
    expect(atom).toContain('xml:lang="ru"');
    for (const article of russian) {
      for (const feed of [rss, atom, json]) expect(feed).toContain(articleUrl(article));
    }
    for (const article of corpus.filter((a) => a.locale !== "ru")) {
      for (const feed of [rss, atom, json]) {
        expect(feed.includes(articleUrl(article)), `${article.id} in a Russian feed`).toBe(false);
      }
    }
  });

  it("sends a Russian search result to a Russian URL", () => {
    const index = buildSearchIndex(russian, "1970-01-01");
    expect(index.documents.length).toBe(russian.length);
    for (const document of index.documents) {
      expect(document.locale, document.id).toBe("ru");
      expect(document.href, document.id).toMatch(/^\/magazine\/ru\//);
      expect(document.sectionName, document.id).toMatch(/[А-Яа-яЁё]/);
    }
  });
});

describe("metadata is distinct across three languages", () => {
  it("has no duplicate title or description anywhere in the corpus", () => {
    const titles = corpus.map((a) => a.seoTitle ?? a.title);
    const descriptions = corpus.map((a) => a.seoDescription ?? a.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("reuses no English or German text on the Russian article", () => {
    for (const article of russian) {
      const source = english.find((candidate) => candidate.id === article.translationOf) as Article;
      for (const field of ["title", "description", "subtitle", "summary"] as const) {
        expect(article[field], `${article.id}.${field}`).not.toBe(source[field]);
      }
      if (article.heroImage !== undefined && source.heroImage !== undefined) {
        /* The same licensed file, a Russian description of it. */
        expect(article.heroImage.src, article.id).toBe(source.heroImage.src);
        expect(article.heroImage.alt, article.id).not.toBe(source.heroImage.alt);
        expect(article.heroImage.license, article.id).toBe(source.heroImage.license);
        expect(article.heroImage.creator, article.id).toBe(source.heroImage.creator);
      }
    }
  });
});

describe("the locale registry", () => {
  it("carries Russian with a bare subtag and a /ru prefix", () => {
    expect(locales).toContain("ru");
    expect(localeDetails.ru.hreflang).toBe("ru");
    expect(localeDetails.ru.pathPrefix).toBe("/ru");
    expect(localeDetails.ru.nativeLabel).toBe("Русский");
    expect(defaultLocale).toBe("en");
  });

  it("gives every author page a path in every language", () => {
    for (const author of authors) {
      for (const locale of locales) {
        expect(authorPath(author.slug, locale), `${author.slug}/${locale}`).toContain(author.slug);
      }
    }
  });
});
