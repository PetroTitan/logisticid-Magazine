import type { Metadata } from "next";

import { defaultLocale, localeDetails, type Locale } from "@/config/locales";
import { magazineUrl, site } from "@/lib/site";

/**
 * Page metadata.
 *
 * Canonical URLs are built as absolute URLs through `magazineUrl`, not as
 * relative paths resolved against `metadataBase`. Under a `basePath` a
 * relative canonical is the single easiest thing to get wrong — it resolves
 * against the origin, not the base path, so `/road-freight/x` would publish a
 * canonical pointing at the MAIN site's `/road-freight/x` and quietly tell
 * search engines that a Magazine article is a duplicate of a service page.
 *
 * Building every canonical through `magazineUrl` also routes it through the
 * infrastructure-hostname guard.
 */
export function pageMetadata(options: {
  /** Magazine-relative path, without the `/magazine` prefix. */
  path: string;
  title: string;
  description: string;
  /** Overrides `title` for Open Graph and Twitter, where one is set. */
  socialTitle?: string;
  socialDescription?: string;
  /** Set for pages that must never be indexed, such as search results. */
  noindex?: boolean;
  /** The language the page is written in. Drives `og:locale` and hreflang. */
  locale?: Locale;
  /**
   * The hreflang cluster, as absolute URLs keyed by `hreflang` value.
   *
   * Passed in rather than derived here, because only the caller knows whether
   * a translation exists — for an article that is an explicit `translationOf`
   * edge in the corpus, and for a section index it is whether that section has
   * anything published in the other language. Omitted means no alternates,
   * which is what a page with one language must advertise.
   */
  languages?: Record<string, string>;
  openGraph?: { type: "article"; publishedTime: string; modifiedTime?: string };
}): Metadata {
  const canonical = magazineUrl(options.path).href;
  const locale = options.locale ?? defaultLocale;
  const socialTitle = options.socialTitle ?? options.title;
  const socialDescription = options.socialDescription ?? options.description;

  return {
    title: options.title,
    description: options.description,
    alternates: {
      // Each language self-canonicalises. A German article never canonicalises
      // to the English one it translates: it is independent content, and
      // pointing it at the English URL would ask a search engine to drop it.
      canonical,
      ...(options.languages === undefined ? {} : { languages: options.languages }),
    },
    // `follow` is deliberate on the noindex pages: a search result page should
    // not be indexed, but the articles it links to should still be reachable.
    ...(options.noindex === true ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: options.openGraph?.type ?? "website",
      url: canonical,
      siteName: site.name,
      title: socialTitle,
      description: socialDescription,
      locale: localeDetails[locale].hreflang,
      ...(options.openGraph === undefined
        ? {}
        : {
            publishedTime: options.openGraph.publishedTime,
            ...(options.openGraph.modifiedTime === undefined
              ? {}
              : { modifiedTime: options.openGraph.modifiedTime }),
          }),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
    },
  };
}
