"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { searchDocuments, type SearchDocument, type SearchIndex } from "@/lib/search";

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

export function SearchClient({ indexPath }: { indexPath: string }) {
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
          Search LogisticID Magazine
        </label>
        <input
          autoComplete="off"
          className="search-form__input"
          id="magazine-search"
          name="q"
          onChange={(event) => setTyped(event.target.value)}
          placeholder="Search articles"
          type="search"
          value={query}
        />
        <button className="button" type="submit">
          Search
        </button>
      </form>

      <div aria-live="polite" role="status">
        {state === "failed" ? (
          <p className="empty-state">
            The search index could not be loaded. Every article is still reachable from the{" "}
            <a href="../">Magazine home page</a> and the section pages.
          </p>
        ) : trimmed === "" ? (
          <p className="empty-state">Type a term to search published articles.</p>
        ) : state === "loading" ? (
          <p className="empty-state">Loading the search index…</p>
        ) : results.length === 0 ? (
          <p className="empty-state">
            No published article matches “{trimmed}”.
          </p>
        ) : (
          <>
            <p className="empty-state">
              {results.length} {results.length === 1 ? "article" : "articles"} match “{trimmed}”.
            </p>
            <ul className="article-list">
              {results.map((document) => (
                <li className="article-list__item" key={document.id}>
                  <p className="article-card__meta">
                    <span className="article-card__section">{document.section}</span>
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
