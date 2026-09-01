import { describe, expect, it } from "vitest";

import { loadArticles, parseArticleFile, publishedArticles, validateCorpus } from "@/content/load";
import { getAuthor } from "@/content/authors";
import { getSection } from "@/content/sections";
import { PUBLIC_STATUSES, type Article } from "@/content/types";

const articles = loadArticles();

describe("the article corpus", () => {
  it("loads and validates every article file", () => {
    expect(articles.length).toBeGreaterThan(0);
  });

  it("publishes only articles whose status permits it", () => {
    for (const article of publishedArticles(articles)) {
      expect(PUBLIC_STATUSES).toContain(article.status);
    }
  });

  it("gives every article a registered section and registered bylines", () => {
    for (const article of articles) {
      expect(getSection(article.section), article.id).toBeDefined();
      for (const author of article.authors) {
        expect(getAuthor(author), `${article.id} / ${author}`).toBeDefined();
      }
    }
  });

  it("resolves every in-text citation to a listed source", () => {
    for (const article of articles) {
      const ids = new Set(article.sources.map((source) => source.id));
      const cited = JSON.stringify(article.body).match(/"sourceId":"([^"]+)"/g) ?? [];
      for (const raw of cited) {
        const id = raw.slice('"sourceId":"'.length, -1);
        expect(ids, `${article.id} cites ${id}`).toContain(id);
      }
    }
  });

  it("never carries a future publication date on public content", () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const article of publishedArticles(articles)) {
      expect(article.datePublished.localeCompare(today), article.id).toBeLessThanOrEqual(0);
    }
  });

  it("keeps dates in the URL out of article slugs", () => {
    for (const article of articles) {
      expect(article.slug, article.id).not.toMatch(/\d{4}/);
    }
  });

  it("records complete provenance for every hero image", () => {
    for (const article of articles) {
      if (article.heroImage === undefined) continue;
      const image = article.heroImage;
      for (const field of ["src", "alt", "source", "creator", "license", "credit"] as const) {
        expect(image[field], `${article.id}.heroImage.${field}`).toBeTruthy();
      }
      expect(image.width).toBeGreaterThan(0);
      expect(image.height).toBeGreaterThan(0);
    }
  });
});

/* ------------------------------------------------------------------ */
/* The validator's refusals                                            */
/* ------------------------------------------------------------------ */

const TODAY = "2026-09-01";

function build(frontmatter: Record<string, unknown>, body = "A paragraph of body text.\n"): string {
  return `---\n${JSON.stringify({
    id: "test-article",
    slug: "test-article",
    section: "road-freight",
    title: "Test article",
    subtitle: "A subtitle.",
    description: "A description.",
    summary: "A summary.",
    authors: ["logisticid-editorial-team"],
    datePublished: "2026-01-01",
    status: "PUBLISHED",
    schemaType: "Article",
    ...frontmatter,
  })}\n---\n\n${body}`;
}

describe("the build refuses to publish", () => {
  it("accepts a well-formed article", () => {
    expect(() => parseArticleFile("ok.md", build({}), TODAY)).not.toThrow();
  });

  it("an unknown author", () => {
    expect(() => parseArticleFile("x.md", build({ authors: ["invented-person"] }), TODAY)).toThrow(
      /not a registered byline/,
    );
  });

  it("an unknown section", () => {
    expect(() => parseArticleFile("x.md", build({ section: "nope" }), TODAY)).toThrow(
      /not a registered section/,
    );
  });

  it("a future publication date on published content", () => {
    expect(() =>
      parseArticleFile("x.md", build({ datePublished: "2099-01-01" }), TODAY),
    ).toThrow(/in the future/);
  });

  it("a slug containing a year", () => {
    expect(() => parseArticleFile("x.md", build({ slug: "freight-in-2026" }), TODAY)).toThrow(
      /contains a year/,
    );
  });

  it("a citation with no matching source", () => {
    expect(() =>
      parseArticleFile("x.md", build({}, "Text with a citation.[^ghost]\n"), TODAY),
    ).toThrow(/no source with that id/);
  });

  it("a source that is listed but never cited", () => {
    expect(() =>
      parseArticleFile(
        "x.md",
        build({
          sources: [
            {
              id: "unused",
              title: "Unused",
              authorsOrOrganization: "Someone",
              sourceType: "statistics",
              accessedAt: "2026-01-01",
            },
          ],
        }),
        TODAY,
      ),
    ).toThrow(/listed but never cited/);
  });

  it("two sources sharing a citation id", () => {
    const source = {
      id: "dup",
      title: "A",
      authorsOrOrganization: "Someone",
      sourceType: "statistics" as const,
      accessedAt: "2026-01-01",
    };
    expect(() =>
      parseArticleFile(
        "x.md",
        build({ sources: [source, { ...source, title: "B" }] }, "Cited.[^dup]\n"),
        TODAY,
      ),
    ).toThrow(/duplicate citation id/);
  });

  it("a source URL that is not https", () => {
    expect(() =>
      parseArticleFile(
        "x.md",
        build({
          sources: [
            {
              id: "s",
              title: "T",
              authorsOrOrganization: "O",
              sourceType: "statistics",
              accessedAt: "2026-01-01",
              url: "http://example.com",
            },
          ],
        }, "Cited.[^s]\n"),
        TODAY,
      ),
    ).toThrow(/must use https/);
  });

  it("a fabricated (non-real) access date", () => {
    expect(() =>
      parseArticleFile(
        "x.md",
        build({
          sources: [
            {
              id: "s",
              title: "T",
              authorsOrOrganization: "O",
              sourceType: "statistics",
              accessedAt: "2026-02-30",
            },
          ],
        }, "Cited.[^s]\n"),
        TODAY,
      ),
    ).toThrow(/accessedAt/);
  });

  it("a hero image with no licence or dimensions", () => {
    expect(() =>
      parseArticleFile(
        "x.md",
        build({ heroImage: { src: "/a.jpg", alt: "Alt" } }),
        TODAY,
      ),
    ).toThrow(/width and heroImage.height/);
  });

  it("a related LogisticID link to a service that does not exist", () => {
    expect(() =>
      parseArticleFile(
        "x.md",
        build({ relatedLogisticID: [{ type: "service", slug: "air-freight" }] }),
        TODAY,
      ),
    ).toThrow(/not a LogisticID service/);
  });

  it("an UPDATED article with no modification date", () => {
    expect(() => parseArticleFile("x.md", build({ status: "UPDATED" }), TODAY)).toThrow(
      /no dateModified/,
    );
  });

  it("a correction that is not recorded in the update history", () => {
    expect(() =>
      parseArticleFile("x.md", build({ correctionNote: "Was wrong." }), TODAY),
    ).toThrow(/must also appear in updateHistory/);
  });

  it("two articles sharing a public URL", () => {
    const one = parseArticleFile("a.md", build({}), TODAY);
    const two = parseArticleFile("b.md", build({ id: "other" }), TODAY);
    expect(() => validateCorpus([one, two])).toThrow(/duplicate public URL/);
  });

  it("a related-article link to unpublished content", () => {
    const draft: Article = { ...parseArticleFile("d.md", build({ id: "draft", slug: "draft-x", status: "DRAFT" }), TODAY) };
    const live = parseArticleFile("l.md", build({ relatedArticles: ["draft"] }), TODAY);
    expect(() => validateCorpus([draft, live])).toThrow(/not public/);
  });
});
