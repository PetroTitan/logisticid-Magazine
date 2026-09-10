import { defaultLocale, type Locale } from "@/config/locales";

/**
 * Where a link into the main LogisticID site should go, per language.
 *
 * THE PROBLEM THIS SOLVES, MEASURED ON A SERVED PAGE.
 *
 * The German article's "Auf der LogisticID-Website" list rendered a German
 * label — "LogisticID für Versender" — pointing at the English `/shippers`
 * page, with nothing saying so. A German label on an English destination is
 * worse than an English label: it promises a German page and delivers an
 * English one, and a screen reader announces the label in German and then
 * reads an English document.
 *
 * So a destination is one of two things and says which:
 *
 * - it has a German equivalent, and the German page links to it;
 * - it does not, and the link carries `lang="en"` and a visible marker, so
 *   changing language is a choice the reader makes rather than a surprise.
 *
 * The main site's route manifest is the authority for which is which. This is
 * a deliberately small mirror of the handful of paths the Magazine links to,
 * kept here rather than fetched, because the two applications deploy
 * independently and a link must resolve at build time.
 */
const GERMAN_EQUIVALENTS: Readonly<Record<string, string>> = {
  "/": "/de",
  "/request-a-quote": "/de/frachtanfrage",
  "/road-freight": "/de/strassengueterverkehr",
  "/contact": "/de/kontakt",
};

export type MainSiteTarget = {
  /** The path on the main site, already localized where possible. */
  readonly path: string;
  /** True when the destination is not in the reader's language. */
  readonly foreignLanguage: boolean;
};

export function mainSiteTarget(path: string, locale: Locale): MainSiteTarget {
  if (locale === defaultLocale) return { path, foreignLanguage: false };
  const german = GERMAN_EQUIVALENTS[path];
  return german === undefined
    ? { path, foreignLanguage: true }
    : { path: german, foreignLanguage: false };
}

/** The marker appended to a label whose destination is in another language. */
export const FOREIGN_LANGUAGE_MARKER: Readonly<Record<Locale, string>> = {
  en: "",
  de: " (englisch)",
};
