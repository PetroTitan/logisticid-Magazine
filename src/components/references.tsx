import type { Source } from "@/content/types";

/**
 * The reference list for an article.
 *
 * Rendered as real, numbered, linkable entries in the initial HTML rather than
 * behind a toggle: a citation a reader cannot check without running JavaScript
 * is not much of a citation, and neither a search engine nor a screen reader
 * should have to work for it.
 */

const TYPE_LABEL: Record<Source["sourceType"], string> = {
  legislation: "Legislation",
  "official-guidance": "Official guidance",
  statistics: "Official statistics",
  "research-paper": "Research paper",
  "institutional-report": "Institutional report",
  standard: "Standard",
  "technical-documentation": "Technical documentation",
  "company-announcement": "Company announcement",
  news: "News report",
};

export function References({ sources }: { sources: readonly Source[] }) {
  if (sources.length === 0) return null;

  return (
    <section aria-labelledby="references-heading" className="references">
      <h2 id="references-heading">References</h2>
      <ol className="references__list">
        {sources.map((source) => (
          <li id={`reference-${source.id}`} key={source.id}>
            <span className="references__type">{TYPE_LABEL[source.sourceType]}</span>
            {source.authorsOrOrganization}
            {". "}
            {source.url === undefined ? (
              <em>{source.title}</em>
            ) : (
              <a href={source.url} rel="nofollow noopener">
                <em>{source.title}</em>
              </a>
            )}
            {source.publication === undefined ? null : <>. {source.publication}</>}
            {source.reportNumber === undefined ? null : <> ({source.reportNumber})</>}
            {source.date === undefined ? null : <>. {source.date}</>}
            {source.doi === undefined ? null : <>. doi:{source.doi}</>}
            {". Accessed "}
            <time dateTime={source.accessedAt}>{source.accessedAt}</time>.
            {source.fullTextConsulted === false ? (
              <span className="references__partial">
                Consulted as an abstract or summary; the full text is not openly accessible and is
                not represented here as having been read in full.
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
