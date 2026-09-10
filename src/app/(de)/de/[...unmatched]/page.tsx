import { notFound } from "next/navigation";

/**
 * Unmatched German URLs, kept inside the German shell.
 *
 * Without a route to match, Next serves its built-in error document and the
 * reader gets an English default in place of the Magazine's own 404. This sits
 * one segment behind a literal `de`, which the router prefers over the English
 * group's root-level catch-all, so a missing German page answers in German and
 * everything else answers in English. `notFound()` returns a real 404 — a
 * German URL that does not exist must never answer 200.
 */
export default function UnmatchedGermanRoute(): never {
  notFound();
}
