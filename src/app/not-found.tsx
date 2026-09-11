import { localeDetails, locales, type Locale } from "@/config/locales";
import { strings } from "@/config/ui-strings";
import { sectionLabels, sections } from "@/content/sections";
import { articlesInSection } from "@/lib/corpus";
import { indexPath, sectionPath, staticPath } from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { BASE_PATH, mainSiteUrl } from "@/lib/site";
import "@/styles/globals.css";

export const metadata = {
  // Written out in full, in both languages. There is no root layout to apply
  // the `%s | LogisticID Magazine` template, so this is the whole tab label.
  title: "404 — Page not found · Seite nicht gefunden · LogisticID Magazine",
  robots: { index: false, follow: true },
};

/**
 * The Magazine's 404, in both languages.
 *
 * ## Why this file exists, and why it is bilingual
 *
 * MEASURED THROUGH THE MAIN SITE'S REWRITE. `src/app/(en)/not-found.tsx` and
 * `src/app/(de)/not-found.tsx` were never rendered. With two root layouts in
 * route groups, Next.js resolves a route-group `not-found` far enough to apply
 * its METADATA — the German 404 really did carry `<title>Seite nicht
 * gefunden</title>` — and then serves its own error document for the body. So
 * every missing Magazine URL, in either language, returned a page with no
 * `lang`, no landmark, no navigation and one line of English. The status was
 * always a genuine 404 and nothing leaked, which is why nothing caught it: the
 * routing validator asks for the status code, and the status code was right.
 *
 * A top-level `not-found.tsx` IS rendered, for every 404 in both languages —
 * and it sits outside both root layouts, so it writes its own `<html>` and
 * `<body>`, and it cannot know which language the reader was reading. The
 * three ways to give it one are all worse than this: reading the pathname
 * makes every public route dynamic, `Accept-Language` is forbidden and wrong,
 * and picking English silently would hand a German reader an English page at a
 * German address — the exact failure the locale split exists to prevent.
 *
 * So it answers in both, and says so by construction: each half is marked with
 * its own `lang`, so a screen reader changes voice at the boundary rather than
 * reading German with an English one.
 *
 * There is no header or footer. Both are locale-bound, and a bilingual page
 * with navigation in one language would be less honest than no navigation.
 */
/**
 * A Magazine-relative path as the browser must see it.
 *
 * PLAIN ANCHORS, NOT `next/link`, AND THE REASON IS MEASURED. This page sits
 * outside both root layouts, so importing `next/link` here pulls its client
 * runtime into a chunk that cannot be shared with the layout graph — 23 kB,
 * loaded by 32 of the 34 prerendered pages, for a component nothing on those
 * pages uses. Client JS went from 577,141 bytes to 600,251; with anchors it is
 * 577,127.
 *
 * Nothing is lost. A navigation out of a layout-less 404 into a page under a
 * root layout is a document load whether `Link` asks for it or not.
 */
function magazinePath(path: string): string {
  return path === "/" ? BASE_PATH : `${BASE_PATH}${path}`;
}

function Half({ locale }: { locale: Locale }) {
  const ui = strings(locale);
  const populated =
    locale === "en"
      ? sections
      : sections.filter((section) => articlesInSection(section.slug, locale).length > 0);

  return (
    <section className="article__aside" lang={localeDetails[locale].hreflang}>
      <h2>{ui.notFoundTitle}</h2>
      <p>{ui.notFoundBody}</p>
      <ul className="linked-list">
        <li>
          {/* `indexPath("en")` is "/", and `/magazine/` is a redirect to
              `/magazine`. Sending a reader who has already hit a dead end
              through a redirect is one avoidable hop too many. */}
            <a href={magazinePath(indexPath(locale))}>{ui.notFoundHome}</a>
        </li>
        {populated.map((section) => (
          <li key={section.slug}>
            <a href={magazinePath(sectionPath(section.slug, locale))}>
              {sectionLabels(section, locale).name}
            </a>
          </li>
        ))}
        <li>
          <a href={magazinePath(staticPath("search", locale))}>{ui.notFoundSearch}</a>
        </li>
        <li>
          <a href={magazinePath(staticPath("corrections", locale))}>{ui.corrections}</a>
        </li>
        <li>
          <a href={mainSiteUrl(mainSiteTarget("/", locale).path).href}>{ui.notFoundMainSite}</a>
        </li>
      </ul>
    </section>
  );
}

export default function MagazineNotFound() {
  return (
    <html lang={localeDetails.en.hreflang}>
      <body>
        <main className="shell page" id="main">
          <p className="page__eyebrow">404</p>
          <h1 className="page__title">
            {strings("en").notFoundTitle} · {strings("de").notFoundTitle}
          </h1>
          <div className="section-grid">
            {locales.map((locale) => (
              <Half key={locale} locale={locale} />
            ))}
          </div>
        </main>
      </body>
    </html>
  );
}
