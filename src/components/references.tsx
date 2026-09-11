import { defaultLocale, type Locale } from "@/config/locales";
import { strings } from "@/config/ui-strings";
import type { Source } from "@/content/types";

/**
 * The reference list for an article.
 *
 * Rendered as real, numbered, linkable entries in the initial HTML rather than
 * behind a toggle: a citation a reader cannot check without running JavaScript
 * is not much of a citation, and neither a search engine nor a screen reader
 * should have to work for it.
 *
 * ## What is translated here and what is not
 *
 * The LABELS are — the heading, the kind of source, "accessed", the note that
 * only an abstract was read. Those are this publication speaking, and on a
 * German article they are read by a German reader.
 *
 * THE SOURCE IS NOT. Its title, its author or issuing body, its publication,
 * its report number, its date and its DOI are reproduced exactly as published.
 * A translated source title is a title nobody published, and a reader who
 * takes it to the register to check the claim will not find it. That
 * distinction — label versus evidence — is the whole citation policy, and it
 * is the one the main site's German phases found easiest to cross by accident.
 */
export function References({
  sources,
  locale = defaultLocale,
}: {
  sources: readonly Source[];
  locale?: Locale;
}) {
  if (sources.length === 0) return null;
  const ui = strings(locale);

  return (
    <section aria-labelledby="references-heading" className="references">
      <h2 id="references-heading">{ui.references}</h2>
      <ol className="references__list">
        {sources.map((source) => (
          <li id={`reference-${source.id}`} key={source.id}>
            <span className="references__type">{ui.sourceTypes[source.sourceType]}</span>
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
            {`. ${ui.accessed} `}
            <time dateTime={source.accessedAt}>{source.accessedAt}</time>.
            {source.fullTextConsulted === false ? (
              <span className="references__partial">{ui.partialConsultation}</span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
