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

/**
 * `alternates.languages` for the index, which exists in every language.
 *
 * ONE FUNCTION, THREE CALLERS. Each index page used to state its own
 * two-entry cluster, and adding a third language left the English and German
 * indexes advertising each other while the Russian one advertised all three —
 * a one-sided cluster, which is the defect the main site's Phase 4S-B2 shipped
 * 59 of. Deriving it once means the three cannot disagree.
 */
export function indexAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[localeDetails[locale].hreflang] = magazineUrl(indexPath(locale)).href;
  }
  languages["x-default"] = magazineUrl(indexPath(defaultLocale)).href;
  return languages;
}

/** The switcher cluster for the index, as Magazine-relative paths. */
export function indexCluster(): Readonly<Record<Locale, string>> {
  return Object.fromEntries(
    locales.map((locale) => [locale, indexPath(locale)]),
  ) as Readonly<Record<Locale, string>>;
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

/* ------------------------------------------------------------------ */
/* Static Magazine routes                                              */
/* ------------------------------------------------------------------ */

/**
 * The Magazine's non-article routes, in each language.
 *
 * Keyed by a language-neutral identity, exactly as the main site's route
 * manifest is, and for the same reason: the German path of the sourcing policy
 * is not derivable from the English one, and deriving it by prefixing `/de`
 * would publish `/magazine/de/sourcing-policy` — a German page at an English
 * address, which is the thing the locale split exists to prevent.
 *
 * SECTION SLUGS ARE NOT IN HERE. A section is identified by its slug, that
 * slug is already in the URL of published articles, and translating it would
 * move pages rather than name them — `src/content/sections.ts` carries the
 * German NAME instead. This table is for routes whose whole identity is the
 * path.
 */
export const magazineStaticRoutes = {
  "editorial-policy": {
    en: "/editorial-policy",
    de: "/de/redaktionsrichtlinien",
    ru: "/ru/redaktsionnye-printsipy",
  },
  "sourcing-policy": {
    en: "/sourcing-policy",
    de: "/de/quellenrichtlinien",
    ru: "/ru/rabota-s-istochnikami",
  },
  "image-policy": {
    en: "/image-policy",
    de: "/de/bild-und-ki-richtlinien",
    ru: "/ru/izobrazheniya-i-ii",
  },
  corrections: { en: "/corrections", de: "/de/korrekturen", ru: "/ru/ispravleniya" },
  authors: { en: "/authors", de: "/de/autoren", ru: "/ru/avtory" },
  search: { en: "/search", de: "/de/suche", ru: "/ru/poisk" },
  rss: { en: "/rss.xml", de: "/de/rss.xml", ru: "/ru/rss.xml" },
  atom: { en: "/atom.xml", de: "/de/atom.xml", ru: "/ru/atom.xml" },
  "json-feed": { en: "/feed.json", de: "/de/feed.json", ru: "/ru/feed.json" },
  "search-index": {
    en: "/search-index.json",
    de: "/de/search-index.json",
    ru: "/ru/search-index.json",
  },
  latest: { en: "/latest.json", de: "/de/latest.json", ru: "/ru/latest.json" },
} as const satisfies Readonly<Record<string, Readonly<Record<Locale, string>>>>;

export type MagazineStaticRoute = keyof typeof magazineStaticRoutes;

/** The Magazine-relative path of a static route in a language. */
export function staticPath(route: MagazineStaticRoute, locale: Locale): string {
  return magazineStaticRoutes[route][locale];
}

/** `alternates.languages` for a static route that exists in every language. */
export function staticAlternates(route: MagazineStaticRoute): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[localeDetails[locale].hreflang] = magazineUrl(staticPath(route, locale)).href;
  }
  languages["x-default"] = magazineUrl(staticPath(route, defaultLocale)).href;
  return languages;
}

/** The Magazine-relative path of an author page in a language. */
export function authorPath(slug: string, locale: Locale): string {
  return `${staticPath("authors", locale)}/${slug}`;
}

/** `alternates.languages` for an author page. */
export function authorAlternates(slug: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[localeDetails[locale].hreflang] = magazineUrl(authorPath(slug, locale)).href;
  }
  languages["x-default"] = magazineUrl(authorPath(slug, defaultLocale)).href;
  return languages;
}

/**
 * `alternates.languages` for the index of one section.
 *
 * TAKES THE LOCALES THAT ACTUALLY HAVE AN INDEX. This used to loop over every
 * locale unconditionally, which was true while both translated locales held an
 * article in every section and became false the moment a third language
 * published one section and not the others — an `hreflang` pointing at a
 * section index that is never generated, which is worse than none because a
 * search engine acts on it.
 *
 * The caller knows: `generateStaticParams` in each translated section route
 * applies exactly the same rule, so the two cannot disagree.
 */
export function sectionAlternates(
  section: string,
  available: readonly Locale[] = locales,
): Record<string, string> | undefined {
  const present = locales.filter(
    (locale) => locale === defaultLocale || available.includes(locale),
  );
  if (present.length < 2) return undefined;
  const languages: Record<string, string> = {};
  for (const locale of present) {
    languages[localeDetails[locale].hreflang] = magazineUrl(sectionPath(section, locale)).href;
  }
  languages["x-default"] = magazineUrl(sectionPath(section, defaultLocale)).href;
  return languages;
}

/** The switcher cluster for a section index, as Magazine-relative paths. */
export function sectionClusterFor(
  section: string,
  available: readonly Locale[] = locales,
): Readonly<Partial<Record<Locale, string>>> {
  const cluster: Partial<Record<Locale, string>> = {};
  for (const locale of locales) {
    if (locale !== defaultLocale && !available.includes(locale)) continue;
    cluster[locale] = sectionPath(section, locale);
  }
  return cluster;
}
