import { describe, expect, it } from "vitest";

import { loadArticles, publishedArticles } from "@/content/load";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { buildSearchIndex, searchDocuments } from "@/lib/search";
import { atomFeed, jsonFeed, latestFeed, rssFeed, sitemapXml } from "@/lib/feeds";
import { magazineUrl } from "@/lib/site";

const articles = publishedArticles(loadArticles());

describe("article structured data", () => {
  it("states the schema type the article actually declares", () => {
    for (const article of articles) {
      expect(articleJsonLd(article)["@type"]).toBe(article.schemaType);
    }
  });

  it("carries a headline, canonical URL, publication date, author and publisher", () => {
    for (const article of articles) {
      const node = articleJsonLd(article);
      expect(node["headline"]).toBe(article.title);
      expect(node["url"]).toBe(magazineUrl(`/${article.section}/${article.slug}`).href);
      expect(node["datePublished"]).toBe(article.datePublished);
      expect(Array.isArray(node["author"])).toBe(true);
      expect(node["publisher"]).toBeDefined();
    }
  });

  it("describes the editorial-team byline as an Organization, not a Person", () => {
    const [article] = articles;
    expect(article).toBeDefined();
    const authors = articleJsonLd(article!)["author"] as { "@type": string }[];
    expect(authors[0]?.["@type"]).toBe("Organization");
  });

  it("numbers breadcrumb positions from one, in order", () => {
    const node = breadcrumbJsonLd([
      { name: "A", url: "https://logisticid.com/" },
      { name: "B", url: "https://logisticid.com/magazine" },
    ]);
    const items = node["itemListElement"] as { position: number }[];
    expect(items.map((item) => item.position)).toEqual([1, 2]);
  });
});

describe("feeds and sitemap", () => {
  it("name only the canonical host", () => {
    const outputs = [
      rssFeed(articles),
      atomFeed(articles, "2026-01-01T00:00:00Z"),
      JSON.stringify(jsonFeed(articles)),
      JSON.stringify(latestFeed(articles, "2026-01-01")),
      JSON.stringify(buildSearchIndex(articles, "2026-01-01")),
      sitemapXml(articles.map((article) => ({ loc: magazineUrl(`/${article.section}/${article.slug}`).href }))),
    ];
    for (const output of outputs) {
      expect(output).not.toMatch(/vercel\.app|netlify\.app|pages\.dev/);
    }
  });

  it("escape XML metacharacters rather than emitting them raw", () => {
    const xml = sitemapXml([{ loc: "https://logisticid.com/magazine/a?b=1&c=2" }]);
    expect(xml).toContain("&amp;");
    expect(xml).not.toMatch(/[^&]&[a-z]+=/);
  });

  it("produce one RSS item and one sitemap entry per published article", () => {
    expect((rssFeed(articles).match(/<item>/g) ?? []).length).toBe(articles.length);
  });

  it("keep the search index at the declared version", () => {
    expect(buildSearchIndex(articles, "2026-01-01").version).toBe(1);
  });
});

describe("search", () => {
  const index = buildSearchIndex(articles, "2026-01-01");

  it("finds an article by a word in its title", () => {
    const results = searchDocuments(index, "pallet");
    expect(results.length).toBeGreaterThan(0);
  });

  it("requires every term to match, rather than any", () => {
    expect(searchDocuments(index, "pallet zzzznotaword")).toHaveLength(0);
  });

  it("links results through the /magazine prefix", () => {
    for (const document of index.documents) {
      expect(document.href.startsWith("/magazine/")).toBe(true);
    }
  });
});
