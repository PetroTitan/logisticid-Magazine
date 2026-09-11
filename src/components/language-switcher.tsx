import { localeDetails, locales, type Locale } from "@/config/locales";
import { strings } from "@/config/ui-strings";
import { BASE_PATH } from "@/lib/site";

/**
 * The Magazine's language control.
 *
 * Takes the cluster rather than computing one: for an article the pairing is
 * an explicit `translationOf` edge in the corpus, and for an index it is
 * whether anything is published in the other language. Both are questions only
 * the page can answer, and both are already answered to build the page's
 * hreflang — so the control and the `<head>` are driven by one value and
 * cannot disagree.
 *
 * Renders nothing for a cluster of one: an article with no translation offers
 * no language choice rather than a link to the other language's index, which
 * would look like an equivalent and be a different page.
 *
 * Server-rendered, no client JavaScript, no flags — a flag is a country and
 * this is a language.
 */
export function LanguageSwitcher({
  locale,
  cluster,
}: {
  locale: Locale;
  /** Magazine-relative paths by locale. */
  cluster: Readonly<Partial<Record<Locale, string>>>;
}) {
  const available = locales.filter((code) => cluster[code] !== undefined);
  if (available.length < 2) return null;

  return (
    <nav aria-label={strings(locale).languageLabel} className="language-switcher">
      <ul>
        {available.map((code) => (
          <li key={code}>
            {code === locale ? (
              <span aria-current="true" lang={localeDetails[code].hreflang}>
                {localeDetails[code].nativeLabel}
              </span>
            ) : (
              <a
                /*
                 * THE BASE PATH IS ADDED HERE, BY HAND, AND IT HAS TO BE.
                 *
                 * MEASURED THROUGH THE MAIN SITE'S REWRITE, ON THE LIVE PILOT
                 * PAGES. This is a plain anchor, and `basePath` is a
                 * `next/link` feature — so `/de/korrekturen` left the Magazine
                 * entirely and asked the MAIN application for
                 * `logisticid.com/de/korrekturen`, which does not exist. The
                 * language control, on every Magazine page in both languages,
                 * was a 404.
                 *
                 * Invisible in development, where the Magazine is reachable at
                 * its own root as well; invisible in the sitemap, which builds
                 * its URLs through `magazineUrl`; invisible to every test that
                 * asserts the CLUSTER rather than the href. It only appears if
                 * something follows the link on the host the reader is on.
                 */
                href={`${BASE_PATH}${cluster[code] as string}`}
                hrefLang={localeDetails[code].hreflang}
                lang={localeDetails[code].hreflang}
              >
                {localeDetails[code].nativeLabel}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
