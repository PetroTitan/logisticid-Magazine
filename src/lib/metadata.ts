import type { Metadata } from "next";

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
  openGraph?: { type: "article"; publishedTime: string; modifiedTime?: string };
}): Metadata {
  const canonical = magazineUrl(options.path).href;
  const socialTitle = options.socialTitle ?? options.title;
  const socialDescription = options.socialDescription ?? options.description;

  return {
    title: options.title,
    description: options.description,
    alternates: { canonical },
    // `follow` is deliberate on the noindex pages: a search result page should
    // not be indexed, but the articles it links to should still be reachable.
    ...(options.noindex === true ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: options.openGraph?.type ?? "website",
      url: canonical,
      siteName: site.name,
      title: socialTitle,
      description: socialDescription,
      locale: site.locale,
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
