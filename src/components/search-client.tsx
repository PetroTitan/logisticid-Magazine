"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { searchDocuments, type SearchDocument, type SearchIndex } from "@/lib/search";

/**
 * The strings this control needs, handed in from the server.
 *
 * A plain serialisable object, not a locale code and a lookup: that keeps the
 * dictionary out of the only client bundle in the application, and it means
 * adding a language ships no extra JavaScript to anybody. There is no runtime
 * translation here and there is not going to be one.
 */
export type SearchLabels = {
  fieldLabel: string;
  placeholder: string;
  submit: string;
  indexFailed: string;
  indexFailedLinkText: string;
  indexFailedTail: string;
  prompt: string;
  loading: string;
  noResults: string;
  resultsOne: string;
  resultsMany: string;
};

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/**
 * Magazine search.
 *
 * The only client component in the application. It reads the query from the
 * address bar rather than from a server-rendered `searchParams`, which keeps
 * the page itself static, and it fetches the generated index once.
 *
 * The query never leaves the browser: there is no request carrying it, and
 * nothing here reports it to an analytics endpoint. What a reader types into a
 * search box on a freight publication can be commercially sensitive — a
 * shipper researching a lane is telling you where they are about to ship — so
 * not collecting it is the design, not an omission.
 */
/**
 * The `?q=` value currently in the address bar.
 *
 * Read through `useSyncExternalStore` rather than copied into state by an
 * effect. The server has no address bar, so the server snapshot is the empty
 * string and the client picks the real value up on hydration without a
 * mismatch — and without a render pass that shows the wrong thing first.
 */
function subscribeToLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function readQueryFromLocation(): string {
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

export function SearchClient({
  indexPath,
  homePath,
  labels,
}: {
  indexPath: string;
  /** Where "the Magazine home page" goes, in this page's language. */
  homePath: string;
  labels: SearchLabels;
}) {
  const urlQuery = useSyncExternalStore(subscribeToLocation, readQueryFromLocation, () => "");

  // `null` until the reader types, so the address bar stays authoritative for
  // a shared or reloaded result URL and stops being so the moment they edit.
  const [typed, setTyped] = useState<string | null>(null);
  const query = typed ?? urlQuery;

  const [index, setIndex] = useState<SearchIndex | undefined>(undefined);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch(indexPath)
      .then((response) => {
        if (!response.ok) throw new Error(`search index responded ${response.status}`);
        return response.json() as Promise<SearchIndex>;
      })
      .then((loaded) => {
        if (cancelled) return;
        setIndex(loaded);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [indexPath]);

  const trimmed = query.trim();
  const results: SearchDocument[] =
    index === undefined || trimmed === "" ? [] : searchDocuments(index, trimmed);

  return (
    <>
      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault();
          // Keep the address bar in step so a result page can be shared or
          // reloaded, without adding a history entry per keystroke.
          const url = new URL(window.location.href);
          if (trimmed === "") url.searchParams.delete("q");
          else url.searchParams.set("q", trimmed);
          window.history.replaceState(null, "", url);
        }}
        role="search"
      >
        <label className="sr-only" htmlFor="magazine-search">
          {labels.fieldLabel}
        </label>
        <input
          autoComplete="off"
          className="search-form__input"
          id="magazine-search"
          name="q"
          onChange={(event) => setTyped(event.target.value)}
          placeholder={labels.placeholder}
          type="search"
          value={query}
        />
        <button className="button" type="submit">
          {labels.submit}
        </button>
      </form>

      <div aria-live="polite" role="status">
        {state === "failed" ? (
          <p className="empty-state">
            {labels.indexFailed} <a href={homePath}>{labels.indexFailedLinkText}</a>{" "}
            {labels.indexFailedTail}
          </p>
        ) : trimmed === "" ? (
          <p className="empty-state">{labels.prompt}</p>
        ) : state === "loading" ? (
          <p className="empty-state">{labels.loading}</p>
        ) : results.length === 0 ? (
          <p className="empty-state">{fill(labels.noResults, { query: trimmed })}</p>
        ) : (
          <>
            <p className="empty-state">
              {fill(results.length === 1 ? labels.resultsOne : labels.resultsMany, {
                count: String(results.length),
                query: trimmed,
              })}
            </p>
            <ul className="article-list">
              {results.map((document) => (
                <li className="article-list__item" key={document.id}>
                  <p className="article-card__meta">
                    <span className="article-card__section">{document.sectionName}</span>
                    <time dateTime={document.publishedAt}>{document.publishedAt}</time>
                  </p>
                  <h2 className="article-card__title">
                    <a href={document.href}>{document.title}</a>
                  </h2>
                  <p className="article-card__summary">{document.description}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
