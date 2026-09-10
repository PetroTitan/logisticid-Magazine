import type { Article } from "@/content/types";
import { articlePath } from "@/lib/localized-routes";
import { magazineUrl, site } from "@/lib/site";

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

export function rssFeed(articles: readonly Article[]): string {
  const self = magazineUrl("/rss.xml").href;
  const home = magazineUrl("/").href;

  const items = articles
    .map((article) =>
      [
        "    <item>",
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${escapeXml(articleUrl(article))}</link>`,
        `      <guid isPermaLink="true">${escapeXml(articleUrl(article))}</guid>`,
        `      <description>${escapeXml(article.description)}</description>`,
        `      <pubDate>${rfc822(article.datePublished)}</pubDate>`,
        `      <category>${escapeXml(article.section)}</category>`,
        "    </item>",
      ].join("\n"),
    )
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(site.name)}</title>`,
    `    <link>${escapeXml(home)}</link>`,
    `    <description>${escapeXml(site.tagline)}</description>`,
    `    <language>${site.locale}</language>`,
    `    <atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml"/>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

export function atomFeed(articles: readonly Article[], updated: string): string {
  const self = magazineUrl("/atom.xml").href;
  const home = magazineUrl("/").href;

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
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${escapeXml(site.name)}</title>`,
    `  <subtitle>${escapeXml(site.tagline)}</subtitle>`,
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
export function jsonFeed(articles: readonly Article[]): Record<string, unknown> {
  return {
    version: "https://jsonfeed.org/version/1.1",
    title: site.name,
    description: site.tagline,
    home_page_url: magazineUrl("/").href,
    feed_url: magazineUrl("/feed.json").href,
    language: site.locale,
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
      href: `/magazine/${article.section}/${article.slug}`,
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
