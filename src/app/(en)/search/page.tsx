import { Breadcrumbs } from "@/components/breadcrumbs";
import { SearchClient } from "@/components/search-client";
import { pageMetadata } from "@/lib/metadata";
import { BASE_PATH, mainSiteUrl } from "@/lib/site";

/**
 * The search page is `noindex, follow`.
 *
 * A search result page is a view of content that already has its own canonical
 * URLs; indexing it would put thin, duplicative, parameterised pages in the
 * index competing with the articles themselves. `follow` is kept so the links
 * out of it are still crawlable.
 */
export const metadata = pageMetadata({
  path: "/search",
  title: "Search",
  description: "Search published LogisticID Magazine articles.",
  noindex: true,
});

export default function SearchPage() {
  return (
    <div className="shell page">
      <Breadcrumbs
        crumbs={[
          { label: "LogisticID", href: mainSiteUrl("/").href },
          { label: "Magazine", href: "/" },
          { label: "Search" },
        ]}
      />
      <h1 className="page__title">Search</h1>
      <p className="page__standfirst">
        Searches run entirely in your browser against a generated index. Nothing you type is sent
        anywhere.
      </p>
      <SearchClient indexPath={`${BASE_PATH}/search-index.json`} />
    </div>
  );
}
