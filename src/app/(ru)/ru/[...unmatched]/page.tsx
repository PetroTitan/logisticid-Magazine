import { notFound } from "next/navigation";

/**
 * Unmatched Russian URLs, kept inside the Russian shell.
 *
 * This sits one segment behind a literal `ru`, which the router prefers over
 * the English group's root-level catch-all, so a missing Russian page is
 * handled here rather than by the English tree. `notFound()` returns a real
 * 404 — a Russian URL that does not exist must never answer 200, and must
 * never answer with the English article at a similar address.
 *
 * The 404 BODY is `src/app/not-found.tsx`, which is bilingual-by-necessity and
 * now trilingual: with three root layouts in route groups, Next.js applies a
 * route-group `not-found`'s metadata and then serves its own error document,
 * so the only file it actually renders is the top-level one. See the header
 * there.
 */
export default function UnmatchedRussianRoute(): never {
  notFound();
}
