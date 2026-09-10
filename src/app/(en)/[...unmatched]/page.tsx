import { notFound } from "next/navigation";

/**
 * Unmatched URLs, reattached to the English layout.
 *
 * Splitting the tree into two root layouts means a URL matching no route has
 * no layout to be composed into, so Next falls back to its own bare error
 * document and the Magazine's designed 404 silently stops rendering — with the
 * correct status, which is what makes it easy to miss. A catch-all is a route,
 * so `notFound()` renders `(en)/not-found.tsx` inside `(en)/layout.tsx` as it
 * did before the groups existed.
 *
 * Real routes still win: a catch-all is the router's lowest-priority match.
 */
export default function UnmatchedRoute(): never {
  notFound();
}
