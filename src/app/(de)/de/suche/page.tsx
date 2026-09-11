import { Breadcrumbs } from "@/components/breadcrumbs";
import { SearchClient } from "@/components/search-client";
import { strings } from "@/config/ui-strings";
import { indexPath, staticPath } from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { pageMetadata } from "@/lib/metadata";
import { searchLabels } from "@/lib/search-labels";
import { BASE_PATH, mainSiteUrl } from "@/lib/site";

/**
 * German search.
 *
 * It reads the GERMAN index, so a German reader searching German words gets
 * German articles at German URLs. Until Phase 4T the German header offered a
 * link labelled "English" that led to the English search over the English
 * corpus — honest, and still English navigation on a German page.
 *
 * `noindex, follow`, exactly as the English page is, and for the same reason.
 */
const ui = strings("de");

export const metadata = pageMetadata({
  path: staticPath("search", "de"),
  locale: "de",
  title: ui.search,
  description: "Veröffentlichte Beiträge von LogisticID Magazine durchsuchen.",
  noindex: true,
});

export default function GermanSearchPage() {
  return (
    <div className="shell page">
      <Breadcrumbs
        locale="de"
        crumbs={[
          { label: "LogisticID", href: mainSiteUrl(mainSiteTarget("/", "de").path).href },
          { label: ui.magazineCrumb, href: indexPath("de") },
          { label: ui.search },
        ]}
      />
      <h1 className="page__title">{ui.search}</h1>
      <p className="page__standfirst">{ui.searchStandfirst}</p>
      <SearchClient
        homePath={`${BASE_PATH}${indexPath("de")}`}
        indexPath={`${BASE_PATH}${staticPath("search-index", "de")}`}
        labels={searchLabels("de")}
      />
    </div>
  );
}
