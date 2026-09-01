import { blocksToText } from "@/content/markdown";
import { getAuthor } from "@/content/authors";
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
  /** Path on the LogisticID host, including the /magazine prefix. */
  href: string;
  section: string;
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
      href: `${BASE_PATH}/${article.section}/${article.slug}`,
      section: article.section,
      publishedAt: article.datePublished,
      tags: article.tags,
      text: [
        article.title,
        article.subtitle,
        article.description,
        article.summary,
        article.section,
        article.tags.join(" "),
        article.authors.map((slug) => getAuthor(slug)?.name ?? slug).join(" "),
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
