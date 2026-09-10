import { defaultLocale, localeDetails, locales, type Locale } from "@/config/locales";
import type { Article } from "@/content/types";
import { magazineUrl } from "@/lib/site";

/**
 * Where each article and each section lives, in each language.
 *
 * THE MAGAZINE'S URL SPACE, WITH A LOCALE IN IT
 *
 *   /magazine/                              English index
 *   /magazine/{section}/                    English section
 *   /magazine/{section}/{slug}              English article
 *   /magazine/de/                           German index
 *   /magazine/de/{section}/                 German section
 *   /magazine/de/{section}/{german-slug}    German article
 *
 * German stays UNDER `/magazine/`, not at `/de/magazine/`. The main
 * application owns `/magazine/*` and rewrites the whole subtree to this
 * service over the private network; a second public prefix would mean a second
 * rewrite rule, a second thing to keep in step with the hosting, and a change
 * to a routing contract that works.
 *
 * SECTION SLUGS ARE NOT TRANSLATED — YET.
 *
 * `road-freight` stays `road-freight` in the German path. Section identity is
 * language-neutral (see `src/content/sections.ts`), and translating the slug
 * is a decision about the taxonomy rather than about an article; it is made
 * once, for all sections, when there are enough German articles for the
 * sections to be worth naming in German. Until then a German article sits in
 * a German path under an English section slug, which is honest — the slug is
 * an identifier — and reversible, because the article's own slug is what a
 * reader reads.
 */

/** The Magazine-relative path of an article, including its locale prefix. */
export function articlePath(article: Article): string {
  return `${localeDetails[article.locale].pathPrefix}/${article.section}/${article.slug}`;
}

/** The Magazine-relative path of a section index in a language. */
export function sectionPath(section: string, locale: Locale): string {
  return `${localeDetails[locale].pathPrefix}/${section}`;
}

/** The Magazine-relative path of the index in a language. */
export function indexPath(locale: Locale): string {
  return localeDetails[locale].pathPrefix === "" ? "/" : localeDetails[locale].pathPrefix;
}

/**
 * The translation cluster an article belongs to, keyed by locale.
 *
 * Built from the explicit `translationOf` edge and nothing else. Matching on
 * slugs could not work — a German article's slug is German — and matching on
 * anything looser would produce an `hreflang` pointing at whatever happened to
 * resemble it.
 *
 * Returns an empty object for an article with no counterpart, so a page with
 * one language advertises no alternates at all. That is the same rule the main
 * site applies, and it is what lets the Magazine publish a single German
 * article without every English article claiming a German version.
 */
export function articleCluster(
  article: Article,
  corpus: readonly Article[],
): Readonly<Partial<Record<Locale, Article>>> {
  const sourceId = article.translationOf ?? article.id;
  const source = corpus.find((candidate) => candidate.id === sourceId);
  if (source === undefined) return {};

  const cluster: Partial<Record<Locale, Article>> = { [source.locale]: source };
  for (const candidate of corpus) {
    if (candidate.translationOf === sourceId) cluster[candidate.locale] = candidate;
  }
  return Object.keys(cluster).length > 1 ? cluster : {};
}

/**
 * `alternates.languages` for an article, as absolute URLs.
 *
 * `x-default` names the default-locale member of the cluster: it is the
 * language every translated article is guaranteed to exist in, and it is not a
 * language selector, because the Magazine has none.
 */
export function articleAlternates(
  article: Article,
  corpus: readonly Article[],
): Record<string, string> | undefined {
  const cluster = articleCluster(article, corpus);
  const entries = Object.entries(cluster) as [Locale, Article][];
  if (entries.length < 2) return undefined;

  const languages: Record<string, string> = {};
  for (const [locale, member] of entries) {
    languages[localeDetails[locale].hreflang] = magazineUrl(articlePath(member)).href;
  }
  const fallback = cluster[defaultLocale];
  if (fallback !== undefined) {
    languages["x-default"] = magazineUrl(articlePath(fallback)).href;
  }
  return languages;
}

/** Articles written in a language. */
export function articlesInLocale<T extends { locale: Locale }>(
  articles: readonly T[],
  locale: Locale,
): readonly T[] {
  return articles.filter((article) => article.locale === locale);
}

/**
 * Locales that actually have a published article.
 *
 * The German shell exists in code and is served only where there is something
 * to serve. An indexable German index listing nothing would be a thin page in
 * a language the publication does not yet publish in, which is worse than not
 * having one.
 */
export function populatedLocales(articles: readonly Article[]): readonly Locale[] {
  return locales.filter((locale) =>
    articles.some((article) => article.locale === locale),
  );
}
