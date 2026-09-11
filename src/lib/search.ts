import type { Locale } from "@/config/locales";
import { blocksToText } from "@/content/markdown";
import { getSection, sectionLabels } from "@/content/sections";
import { articlePath } from "@/lib/localized-routes";
import { authorLabels, getAuthor } from "@/content/authors";
import type { Article } from "@/content/types";
import { BASE_PATH } from "@/lib/site";

/**
 * The static search contract.
 *
 * The Magazine has no search backend. The index is generated at build time and
 * served as one small JSON document; the browser scores it locally. That keeps
 * search working with no server, no query logging and no way for a search
 * string to leave the reader's machine.
 *
 * `version` is part of the contract because the main LogisticID site is
 * expected to consume this document eventually. A consumer can then refuse a
 * shape it does not understand instead of silently mis-reading it.
 */
export const SEARCH_INDEX_VERSION = 1;

export type SearchDocument = {
  id: string;
  type: "magazine-article";
  title: string;
  description: string;
  /** The language this document is written in. */
  locale: Locale;
  /** Path on the LogisticID host, including the /magazine prefix. */
  href: string;
  /** The section's slug — its identity, stable across languages. */
  section: string;
  /** The section's name in this document's language, for display. */
  sectionName: string;
  publishedAt: string;
  tags: string[];
  /** Lowercased searchable text: title, standfirst, summary, authors, body. */
  text: string;
};

export type SearchIndex = {
  version: number;
  generatedAt: string;
  documents: SearchDocument[];
};

export function buildSearchIndex(articles: readonly Article[], generatedAt: string): SearchIndex {
  return {
    version: SEARCH_INDEX_VERSION,
    generatedAt,
    documents: articles.map((article) => ({
      id: article.id,
      type: "magazine-article" as const,
      title: article.title,
      description: article.description,
      locale: article.locale,
      /*
       * Through `articlePath`, so a German article's search result links to
       * its German URL. Composed from section and slug alone — as this was —
       * it named `/magazine/shipping-guides/welche-angaben-…`, an English path
       * that 404s. Exactly the defect Phase 4S-A found in the article's
       * JSON-LD, in a second place nobody had looked.
       */
      href: `${BASE_PATH}${articlePath(article)}`,
      section: article.section,
      sectionName: (() => {
        const section = getSection(article.section);
        return section === undefined
          ? article.section
          : sectionLabels(section, article.locale).name;
      })(),
      publishedAt: article.datePublished,
      tags: article.tags,
      text: [
        article.title,
        article.subtitle,
        article.description,
        article.summary,
        article.section,
        article.tags.join(" "),
        article.authors
          .map((slug) => {
            const author = getAuthor(slug);
            return author === undefined ? slug : authorLabels(author, article.locale).name;
          })
          .join(" "),
        blocksToText(article.body),
      ]
        .join(" ")
        .toLowerCase(),
    })),
  };
}

/**
 * Score a document against a query.
 *
 * Deliberately simple and explainable: every query term must appear somewhere
 * in the document, and matches in the title and description weigh more than
 * matches in the body. There is no relevance model to tune and nothing that
 * could be mistaken for a ranking of quality or popularity.
 */
export function scoreDocument(document: SearchDocument, query: string): number {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0;

  const title = document.title.toLowerCase();
  const description = document.description.toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (!document.text.includes(term)) return 0;
    if (title.includes(term)) score += 10;
    if (description.includes(term)) score += 4;
    if (document.tags.some((tag) => tag.toLowerCase().includes(term))) score += 3;
    score += 1;
  }
  return score;
}

export function searchDocuments(index: SearchIndex, query: string): SearchDocument[] {
  return index.documents
    .map((document) => ({ document, score: scoreDocument(document, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : b.document.publishedAt.localeCompare(a.document.publishedAt),
    )
    .map((entry) => entry.document);
}
