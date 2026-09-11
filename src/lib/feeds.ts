import { defaultLocale, localeDetails, type Locale } from "@/config/locales";
import { strings } from "@/config/ui-strings";
import { getSection, sectionLabels } from "@/content/sections";
import type { Article } from "@/content/types";
import { articlePath, indexPath, staticPath } from "@/lib/localized-routes";
import { magazineUrl } from "@/lib/site";

/**
 * Feed and sitemap construction.
 *
 * All of these are route handlers rather than files in `public/`, because a
 * `basePath` does not rewrite `public/` — a feed placed there would be served
 * from the host root, outside the `/magazine` namespace the proxy routes, and
 * would 404 in production while working perfectly in local development.
 *
 * Cache headers are set deliberately. A feed that a CDN holds indefinitely
 * means a newly published article never reaches subscribers; one that is never
 * cached puts every poll through to the origin. A short max-age with a longer
 * stale-while-revalidate window gives quick propagation and cheap polling.
 */
export const FEED_CACHE_CONTROL = "public, max-age=600, s-maxage=600, stale-while-revalidate=3600";

/** A section's display name in the article's own language. */
function sectionName(article: Article): string {
  const section = getSection(article.section);
  return section === undefined ? article.section : sectionLabels(section, article.locale).name;
}

/** Escape text for inclusion in XML character data or an attribute value. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** An article's date as an RFC 822 string, which is what RSS 2.0 requires. */
export function rfc822(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}

/** An article's date as an RFC 3339 timestamp, which is what Atom requires. */
export function rfc3339(date: string): string {
  return `${date}T00:00:00Z`;
}

/** The date an article was last meaningfully changed. */
export function lastChanged(article: Article): string {
  return article.dateModified ?? article.datePublished;
}

export function articleUrl(article: Article): string {
  // Through `articlePath`, so a German article's URL carries its locale
  // prefix. Building it from section and slug alone would put every German
  // article at an English URL in the sitemap and in every feed.
  return magazineUrl(articlePath(article)).href;
}

/**
 * One feed per language.
 *
 * NOT one feed with a `<language>` per item, and not one feed carrying both.
 * A feed is a subscription: a reader who subscribes to the German feed has
 * said which language they read, and delivering English articles into it is
 * the mixed-language failure §32 of the phase brief names. The channel-level
 * `language` element exists precisely because the channel, not the item, is
 * what a subscriber chose.
 */
export function rssFeed(articles: readonly Article[], locale: Locale = defaultLocale): string {
  const ui = strings(locale);
  const self = magazineUrl(staticPath("rss", locale)).href;
  const home = magazineUrl(indexPath(locale)).href;

  const items = articles
    .map((article) =>
      [
        "    <item>",
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${escapeXml(articleUrl(article))}</link>`,
        `      <guid isPermaLink="true">${escapeXml(articleUrl(article))}</guid>`,
        `      <description>${escapeXml(article.description)}</description>`,
        `      <pubDate>${rfc822(article.datePublished)}</pubDate>`,
        // The section NAME, in the feed's language — what a feed reader shows
        // a person. The slug is the identity and stays out of the reader's
        // view; `shipping-guides` inside a German document is a token, not a
        // category.
        `      <category>${escapeXml(sectionName(article))}</category>`,
        "    </item>",
      ].join("\n"),
    )
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(ui.feedTitle)}</title>`,
    `    <link>${escapeXml(home)}</link>`,
    `    <description>${escapeXml(ui.feedDescription)}</description>`,
    `    <language>${localeDetails[locale].hreflang}</language>`,
    `    <atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml"/>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

export function atomFeed(
  articles: readonly Article[],
  updated: string,
  locale: Locale = defaultLocale,
): string {
  const ui = strings(locale);
  const self = magazineUrl(staticPath("atom", locale)).href;
  const home = magazineUrl(indexPath(locale)).href;

  const entries = articles
    .map((article) =>
      [
        "  <entry>",
        `    <title>${escapeXml(article.title)}</title>`,
        `    <link href="${escapeXml(articleUrl(article))}" rel="alternate"/>`,
        `    <id>${escapeXml(articleUrl(article))}</id>`,
        `    <published>${rfc3339(article.datePublished)}</published>`,
        `    <updated>${rfc3339(lastChanged(article))}</updated>`,
        `    <summary>${escapeXml(article.description)}</summary>`,
        "  </entry>",
      ].join("\n"),
    )
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${localeDetails[locale].hreflang}">`,
    `  <title>${escapeXml(ui.feedTitle)}</title>`,
    `  <subtitle>${escapeXml(ui.feedDescription)}</subtitle>`,
    `  <link href="${escapeXml(self)}" rel="self"/>`,
    `  <link href="${escapeXml(home)}" rel="alternate"/>`,
    `  <id>${escapeXml(home)}</id>`,
    `  <updated>${updated}</updated>`,
    entries,
    "</feed>",
    "",
  ].join("\n");
}

/** JSON Feed 1.1 — https://www.jsonfeed.org/version/1.1/ */
export function jsonFeed(
  articles: readonly Article[],
  locale: Locale = defaultLocale,
): Record<string, unknown> {
  const ui = strings(locale);
  return {
    version: "https://jsonfeed.org/version/1.1",
    title: ui.feedTitle,
    description: ui.feedDescription,
    home_page_url: magazineUrl(indexPath(locale)).href,
    feed_url: magazineUrl(staticPath("json-feed", locale)).href,
    language: localeDetails[locale].hreflang,
    items: articles.map((article) => ({
      id: articleUrl(article),
      url: articleUrl(article),
      title: article.title,
      summary: article.description,
      date_published: rfc3339(article.datePublished),
      ...(article.dateModified === undefined
        ? {}
        : { date_modified: rfc3339(article.dateModified) }),
      tags: article.tags,
    })),
  };
}

/**
 * A deliberately small feed for the main LogisticID site to consume.
 *
 * It exists so that the main site can show recent Magazine articles without
 * importing the Magazine's content, its build, or its release cycle — and
 * without either project being able to break the other's deployment. It is
 * public, cacheable, versioned and carries nothing sensitive.
 */
export function latestFeed(
  articles: readonly Article[],
  generatedAt: string,
  limit = 10,
): Record<string, unknown> {
  return {
    version: 1,
    generatedAt,
    articles: articles.slice(0, limit).map((article) => ({
      id: article.id,
      title: article.title,
      description: article.description,
      /*
       * Through `articlePath`, so a German article is advertised at its German
       * URL. Composed from section and slug — as this was — it handed the main
       * site `/magazine/shipping-guides/welche-angaben-…`, an English path that
       * 404s. The consumer is another application, which makes the defect
       * invisible from here and 404 over there.
       */
      href: `/magazine${articlePath(article)}`,
      locale: article.locale,
      section: article.section,
      publishedAt: article.datePublished,
      readingTime: article.readingTime,
    })),
  };
}

/**
 * The Magazine's own sitemap.
 *
 * It lists only canonical, indexable, published Magazine URLs. It never
 * includes the search page (noindex), and it is a separate document from the
 * main site's sitemap so that publishing an article does not require the main
 * application to rebuild.
 */
export function sitemapXml(
  entries: readonly { loc: string; lastmod?: string }[],
): string {
  const urls = entries
    .map((entry) =>
      [
        "  <url>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        ...(entry.lastmod === undefined ? [] : [`    <lastmod>${entry.lastmod}</lastmod>`]),
        "  </url>",
      ].join("\n"),
    )
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}
