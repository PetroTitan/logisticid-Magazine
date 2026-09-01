import { getAuthor } from "@/content/authors";
import { getSection } from "@/content/sections";
import type { Article } from "@/content/types";
import { magazineUrl, mainSiteUrl, site } from "@/lib/site";

/**
 * Structured data.
 *
 * Every value here is derived from the validated article record, so the
 * structured data cannot say something the page does not. That matters more
 * than it sounds: JSON-LD is read by machines and not proofread by anyone, so
 * a hand-maintained block is where a stale date or an invented author survives
 * longest.
 */

type JsonObject = Record<string, unknown>;

/** The publisher of the Magazine is LogisticID itself. */
function publisher(): JsonObject {
  return {
    "@type": "Organization",
    name: site.parentName,
    url: mainSiteUrl("/").href,
  };
}

/**
 * The author node.
 *
 * `Organization` when the byline is the editorial team, `Person` when it is a
 * named colleague. Emitting `Person` for a team byline would assert that a
 * person exists who does not.
 */
function authorNode(slug: string): JsonObject {
  const author = getAuthor(slug);
  if (author === undefined) {
    throw new Error(`Cannot build JSON-LD for unknown author "${slug}"`);
  }
  return {
    "@type": author.isOrganization ? "Organization" : "Person",
    name: author.name,
    url: magazineUrl(`/authors/${author.slug}`).href,
  };
}

export function articleJsonLd(article: Article): JsonObject {
  const url = magazineUrl(`/${article.section}/${article.slug}`).href;

  const node: JsonObject = {
    "@context": "https://schema.org",
    "@type": article.schemaType,
    headline: article.title,
    description: article.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    datePublished: article.datePublished,
    author: article.authors.map(authorNode),
    publisher: publisher(),
    inLanguage: site.locale,
    isAccessibleForFree: true,
  };

  if (article.dateModified !== undefined) node["dateModified"] = article.dateModified;

  if (article.heroImage !== undefined) {
    node["image"] = {
      "@type": "ImageObject",
      url: magazineUrl(article.heroImage.src).href,
      width: article.heroImage.width,
      height: article.heroImage.height,
    };
  }

  const section = getSection(article.section);
  if (section !== undefined) node["articleSection"] = section.name;

  if (article.tags.length > 0) node["keywords"] = article.tags.join(", ");

  // `citation` lets a machine see the sources the article rests on, which is
  // the same claim the visible reference list makes to a reader.
  if (article.sources.length > 0) {
    node["citation"] = article.sources.map((source) => {
      const citation: JsonObject = { "@type": "CreativeWork", name: source.title };
      if (source.url !== undefined) citation["url"] = source.url;
      if (source.date !== undefined) citation["datePublished"] = source.date;
      return citation;
    });
  }

  return node;
}

export type BreadcrumbEntry = { name: string; url: string };

export function breadcrumbJsonLd(entries: readonly BreadcrumbEntry[]): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.url,
    })),
  };
}
