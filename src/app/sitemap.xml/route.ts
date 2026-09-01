import { sections } from "@/content/sections";
import { authors } from "@/content/authors";
import { publicArticles } from "@/lib/corpus";
import { articleUrl, lastChanged, sitemapXml } from "@/lib/feeds";
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
  const articles = publicArticles();

  // The search page is deliberately absent: it is noindex, and a sitemap that
  // lists a noindexed URL sends a search engine two contradictory signals.
  const entries = [
    { loc: magazineUrl("/").href },
    ...sections.map((section) => ({ loc: magazineUrl(`/${section.slug}`).href })),
    { loc: magazineUrl("/authors").href },
    ...authors.map((author) => ({ loc: magazineUrl(`/authors/${author.slug}`).href })),
    ...POLICY_PATHS.map((path) => ({ loc: magazineUrl(path).href })),
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
