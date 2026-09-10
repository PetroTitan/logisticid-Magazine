import "server-only";

import { defaultLocale, type Locale } from "@/config/locales";
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

/**
 * Every public article, in every language, newest first.
 *
 * Only the sitemap and the translation-cluster lookup want this. Everything
 * else wants one language, and asking for "the articles" when you mean "the
 * English articles" is how a German article ends up in an English feed.
 */
export function allPublicArticles(): Article[] {
  return publishedArticles(allArticles());
}

/**
 * Public articles in one language, newest first.
 *
 * `publicArticles()` DEFAULTS TO ENGLISH, and that default is the reason no
 * existing caller had to change when the Magazine gained a second language.
 * The English index, the English section pages, the feeds, the search index,
 * the corrections list and the author pages all call it, and every one of them
 * became locale-correct without an edit — rather than each having to remember
 * to filter, which is the version somebody forgets.
 */
export function publicArticles(locale: Locale = defaultLocale): Article[] {
  return allPublicArticles().filter((article) => article.locale === locale);
}

export function articlesInSection(
  section: string,
  locale: Locale = defaultLocale,
): Article[] {
  return publicArticles(locale).filter((article) => article.section === section);
}

export function findArticle(
  section: string,
  slug: string,
  locale: Locale = defaultLocale,
): Article | undefined {
  return publicArticles(locale).find(
    (article) => article.section === section && article.slug === slug,
  );
}

/** Any public article by id, in any language — used to resolve cross-references. */
export function articleById(id: string): Article | undefined {
  return allPublicArticles().find((article) => article.id === id);
}
