import { Breadcrumbs } from "@/components/breadcrumbs";
import { SearchClient } from "@/components/search-client";
import { strings } from "@/config/ui-strings";
import { indexPath, staticPath } from "@/lib/localized-routes";
import { pageMetadata } from "@/lib/metadata";
import { searchLabels } from "@/lib/search-labels";
import { BASE_PATH, mainSiteUrl } from "@/lib/site";

/**
 * The search page is `noindex, follow`.
 *
 * A search result page is a view of content that already has its own canonical
 * URLs; indexing it would put thin, duplicative, parameterised pages in the
 * index competing with the articles themselves. `follow` is kept so the links
 * out of it are still crawlable.
 *
 * No `hreflang` cluster, deliberately. A noindexed page that advertises
 * alternates asks a search engine to build a cluster out of pages it has been
 * told not to index; the German search page exists and is reachable from the
 * German header, which is where a reader needs it.
 */
const ui = strings("en");

export const metadata = pageMetadata({
  path: staticPath("search", "en"),
  title: ui.search,
  description: "Search published LogisticID Magazine articles.",
  noindex: true,
});

export default function SearchPage() {
  return (
    <div className="shell page">
      <Breadcrumbs
        crumbs={[
          { label: "LogisticID", href: mainSiteUrl("/").href },
          { label: ui.magazineCrumb, href: indexPath("en") },
          { label: ui.search },
        ]}
      />
      <h1 className="page__title">{ui.search}</h1>
      <p className="page__standfirst">{ui.searchStandfirst}</p>
      <SearchClient
        homePath={`${BASE_PATH}${indexPath("en")}`}
        indexPath={`${BASE_PATH}${staticPath("search-index", "en")}`}
        labels={searchLabels("en")}
      />
    </div>
  );
}
