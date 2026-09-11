import { authorLabels, getAuthor } from "@/content/authors";
import { getSection, sectionLabels } from "@/content/sections";
import type { Article } from "@/content/types";
import { publisher as publisherIdentity } from "@/config/publisher";
import { localeDetails, type Locale } from "@/config/locales";
import { articlePath, authorPath } from "@/lib/localized-routes";
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

/**
 * The publisher of the Magazine is LogisticID itself.
 *
 * `legalName` is emitted alongside the brand because the main site's
 * Organization entity carries it and the two describe the same company. The
 * node stays a REFERENCE to that entity rather than a second declaration of
 * it: `url` points at the main site, where the full record — company number,
 * registered address, contact address — is published once. Repeating those
 * here would put the same facts in two places for a machine to reconcile,
 * which is the drift `docs/company/corporate-identity.md` exists to prevent.
 *
 * No `vatID`. The company is not registered for VAT.
 */
function publisher(): JsonObject {
  return {
    "@type": "Organization",
    name: site.parentName,
    legalName: publisherIdentity.legalName,
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
function authorNode(slug: string, locale: Locale): JsonObject {
  const author = getAuthor(slug);
  if (author === undefined) {
    throw new Error(`Cannot build JSON-LD for unknown author "${slug}"`);
  }
  return {
    "@type": author.isOrganization ? "Organization" : "Person",
    // The byline as the article prints it, and the author page the article
    // links to — both in the article's language. A German article whose
    // `author.url` names the English author page describes a byline the page
    // does not show, which is the `mainEntityOfPage` defect one field along.
    name: authorLabels(author, locale).name,
    url: magazineUrl(authorPath(author.slug, locale)).href,
  };
}

export function articleJsonLd(article: Article): JsonObject {
  /**
   * Built through `articlePath`, so a German article's `url` and
   * `mainEntityOfPage` carry its locale prefix.
   *
   * MEASURED, AND THE REASON THIS IS NOT `/${section}/${slug}`. Composed from
   * the section and slug alone, the German article's structured data named
   * `/magazine/shipping-guides/welche-angaben-…` — an English path that does
   * not exist and returns 404 — while the page's own canonical correctly named
   * the `/de/` one. Two identities for one page, one of them broken, and
   * nothing in the build said so.
   */
  const url = magazineUrl(articlePath(article)).href;

  const node: JsonObject = {
    "@context": "https://schema.org",
    "@type": article.schemaType,
    headline: article.title,
    description: article.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    datePublished: article.datePublished,
    author: article.authors.map((slug) => authorNode(slug, article.locale)),
    publisher: publisher(),
    // The article's own language, not the publication's default. A German
    // article declaring `en` tells a search engine the text is English, which
    // is the one thing the localization exists to state correctly.
    inLanguage: localeDetails[article.locale].hreflang,
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
  if (section !== undefined) {
    // The section name IN THE ARTICLE'S LANGUAGE. `articleSection` is a
    // display string, and a German article declaring `articleSection:
    // "Shipping guides"` describes itself to a machine in a language it is
    // not written in — the same defect class as `inLanguage: "en"`, one
    // field along.
    node["articleSection"] = sectionLabels(section, article.locale).name;
  }

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
