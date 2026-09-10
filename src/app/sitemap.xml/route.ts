import { sections } from "@/content/sections";
import { authors } from "@/content/authors";
import { defaultLocale, locales } from "@/config/locales";
import { allPublicArticles, articlesInSection, publicArticles } from "@/lib/corpus";
import { articleUrl, lastChanged, sitemapXml } from "@/lib/feeds";
import { indexPath, sectionPath } from "@/lib/localized-routes";
import { magazineUrl } from "@/lib/site";

export const dynamic = "force-static";

/** Policy pages. Listed explicitly so a new route cannot silently escape the sitemap. */
const POLICY_PATHS = [
  "/editorial-policy",
  "/sourcing-policy",
  "/image-policy",
  "/corrections",
] as const;

export function GET() {
  const articles = allPublicArticles();

  /**
   * Localized index and section URLs, for languages that actually publish.
   *
   * A German section index is generated only where that section holds a German
   * article — `generateStaticParams` in the German section route applies the
   * same rule — so listing one here that does not exist would advertise a 404.
   * Reading `articlesInSection` rather than repeating the list keeps the two
   * from disagreeing.
   */
  const localized = locales
    .filter((locale) => locale !== defaultLocale)
    .filter((locale) => publicArticles(locale).length > 0)
    .flatMap((locale) => [
      { loc: magazineUrl(indexPath(locale)).href },
      ...sections
        .filter((section) => articlesInSection(section.slug, locale).length > 0)
        .map((section) => ({ loc: magazineUrl(sectionPath(section.slug, locale)).href })),
    ]);

  // The search page is deliberately absent: it is noindex, and a sitemap that
  // lists a noindexed URL sends a search engine two contradictory signals.
  const entries = [
    { loc: magazineUrl("/").href },
    ...sections.map((section) => ({ loc: magazineUrl(`/${section.slug}`).href })),
    { loc: magazineUrl("/authors").href },
    ...authors.map((author) => ({ loc: magazineUrl(`/authors/${author.slug}`).href })),
    ...POLICY_PATHS.map((path) => ({ loc: magazineUrl(path).href })),
    ...localized,
    ...articles.map((article) => ({
      loc: articleUrl(article),
      lastmod: lastChanged(article),
    })),
  ];

  return new Response(sitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
