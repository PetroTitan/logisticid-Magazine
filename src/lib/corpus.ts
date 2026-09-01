import "server-only";

import { loadArticles, publishedArticles } from "@/content/load";
import type { Article } from "@/content/types";

/**
 * The article corpus, read once per build.
 *
 * `loadArticles` touches the filesystem and validates everything, so it is
 * memoised here rather than repeated for each of the pages, feeds, sitemap and
 * search-index routes that need it. `server-only` keeps the filesystem access
 * — and the unpublished drafts it reads — out of any client bundle.
 */
let cache: Article[] | undefined;

export function allArticles(): Article[] {
  cache ??= loadArticles();
  return cache;
}

/** Public articles, newest first. */
export function publicArticles(): Article[] {
  return publishedArticles(allArticles());
}

export function articlesInSection(section: string): Article[] {
  return publicArticles().filter((article) => article.section === section);
}

export function findArticle(section: string, slug: string): Article | undefined {
  return publicArticles().find(
    (article) => article.section === section && article.slug === slug,
  );
}

export function articleById(id: string): Article | undefined {
  return publicArticles().find((article) => article.id === id);
}
