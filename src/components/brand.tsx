import Link from "next/link";

/**
 * The LogisticID mark and wordmark.
 *
 * The mark is the existing LogisticID connected-route symbol, unchanged: two
 * endpoints joined by a routed path. The Magazine adds only the word
 * "Magazine" after the wordmark, so the publication reads as part of
 * LogisticID rather than as a second brand with its own logo.
 *
 * `href` is a Magazine-relative path — Next.js adds the `/magazine` base path
 * to it automatically.
 */
export function Brand() {
  return (
    <Link aria-label="LogisticID Magazine home" className="brand" href="/">
      <svg aria-hidden="true" className="brand__mark" viewBox="0 0 48 48">
        <path d="M12 10v17c0 5 4 9 9 9h15" />
        <circle cx="12" cy="10" r="4" />
        <circle cx="36" cy="36" r="4" />
      </svg>
      <span className="brand__name">
        LogisticID <span className="brand__suffix">Magazine</span>
      </span>
    </Link>
  );
}
