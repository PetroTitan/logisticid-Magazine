import { Breadcrumbs } from "@/components/breadcrumbs";
import { SearchClient } from "@/components/search-client";
import { strings } from "@/config/ui-strings";
import { indexPath, staticPath } from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { pageMetadata } from "@/lib/metadata";
import { searchLabels } from "@/lib/search-labels";
import { BASE_PATH, mainSiteUrl } from "@/lib/site";

/**
 * Russian search.
 *
 * It reads the RUSSIAN index, so a Russian reader searching Russian words gets
 * Russian articles at Russian URLs.
 *
 * `noindex, follow`, exactly as the other two are, and for the same reason: a
 * search result page is a view of content that already has its own canonical
 * URLs.
 */
const ui = strings("ru");

export const metadata = pageMetadata({
  path: staticPath("search", "ru"),
  locale: "ru",
  title: ui.search,
  description: "Поиск по опубликованным материалам LogisticID Magazine.",
  noindex: true,
});

export default function RussianSearchPage() {
  return (
    <div className="shell page">
      <Breadcrumbs
        locale="ru"
        crumbs={[
          { label: "LogisticID", href: mainSiteUrl(mainSiteTarget("/", "ru").path).href },
          { label: ui.magazineCrumb, href: indexPath("ru") },
          { label: ui.search },
        ]}
      />
      <h1 className="page__title">{ui.search}</h1>
      <p className="page__standfirst">{ui.searchStandfirst}</p>
      <SearchClient
        homePath={`${BASE_PATH}${indexPath("ru")}`}
        indexPath={`${BASE_PATH}${staticPath("search-index", "ru")}`}
        labels={searchLabels("ru")}
      />
    </div>
  );
}
