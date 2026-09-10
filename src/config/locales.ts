/**
 * The languages the Magazine publishes in.
 *
 * A DELIBERATE MIRROR of `src/config/locales.ts` in the main repository. The
 * two applications serve one hostname for one publication, and a reader
 * crossing from `logisticid.com/de/…` into `logisticid.com/magazine/de/…`
 * must not find a different idea of what "de" means — a different `hreflang`
 * value, a different native label or a different path prefix would each show
 * up as an inconsistency a search engine acts on.
 *
 * There is no shared package, deliberately: the two deployments are
 * independent and neither needs the other present to build. What keeps them in
 * step is `docs/company/corporate-identity.md`-style discipline applied to
 * locales — `tests/content/corporate-parity.test.ts` asserts every value here
 * against the record both repositories hold.
 *
 * ONE URL IS ONE LANGUAGE. Nothing here reads `Accept-Language`, a cookie, or
 * a country. The path decides, which is what keeps the Magazine statically
 * generated behind the main site's rewrite.
 */

export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];

/** The locale served from the root of the Magazine's base path. */
export const defaultLocale: Locale = "en";

export type LocaleDetail = {
  readonly code: Locale;
  /** The `lang` attribute and the `hreflang` value. Bare language subtag. */
  readonly hreflang: string;
  readonly label: string;
  /** How the language names itself, for the language switcher. */
  readonly nativeLabel: string;
  /** Path prefix INSIDE the base path: "" for English, "/de" for German. */
  readonly pathPrefix: string;
  /** BCP 47 tag used for date formatting. */
  readonly formattingLocale: string;
};

export const localeDetails: Readonly<Record<Locale, LocaleDetail>> = {
  en: {
    code: "en",
    hreflang: "en",
    label: "English",
    nativeLabel: "English",
    pathPrefix: "",
    formattingLocale: "en-GB",
  },
  de: {
    code: "de",
    hreflang: "de",
    label: "German",
    nativeLabel: "Deutsch",
    pathPrefix: "/de",
    formattingLocale: "de-DE",
  },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Locale codes that may not be used as a section slug.
 *
 * `/magazine/de` belongs to German. A section slugged `de` would occupy the
 * same URL as the whole German tree, and the router would resolve it by
 * precedence rather than by anybody's decision. `tests/content/corpus.test.ts`
 * asserts no section claims one.
 */
export const reservedSectionSlugs: readonly string[] = locales.filter(
  (locale) => locale !== defaultLocale,
);

/** The Magazine-relative path prefix for a locale. */
export function localePrefix(locale: Locale): string {
  return localeDetails[locale].pathPrefix;
}
