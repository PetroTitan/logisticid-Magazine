import Link from "next/link";

import { Brand } from "@/components/brand";
import { defaultLocale, type Locale } from "@/config/locales";
import { sectionLabels, sections } from "@/content/sections";
import { articlesInSection } from "@/lib/corpus";
import { strings } from "@/config/ui-strings";
import { indexPath, sectionPath, staticPath } from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { mainSiteUrl } from "@/lib/site";

/**
 * The Magazine header.
 *
 * The last item is deliberately a route back out to the main LogisticID site.
 * A reader who arrives on an article from a search result has no other way
 * back to the company, and an editorial section that cannot be left is a
 * dead end rather than part of one website.
 *
 * That link is an absolute URL to the main host, not a relative path: a
 * relative "/" would resolve to `/magazine/` under the base path and simply
 * return the reader to where they already are.
 */
export function SiteHeader({ locale = defaultLocale }: { locale?: Locale } = {}) {
  /*
   * A localized header lists the sections that have something published in
   * that language. A "Rubriken" link landing on an English section index is
   * the accidental mixed-language navigation the localization exists to avoid,
   * and the reader only discovers it after the click.
   *
   * Section NAMES stay as the registry writes them: section identity is
   * language-neutral, and translating the display names is a taxonomy decision
   * taken once for all sections rather than per header. See
   * `src/lib/localized-routes.ts`.
   */
  const visible =
    locale === defaultLocale
      ? sections
      : sections.filter((section) => articlesInSection(section.slug, locale).length > 0);

  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Brand href={indexPath(locale)} locale={locale} />
        <nav aria-label="LogisticID Magazine" className="site-nav">
          {visible.map((section) => (
            <Link
              className="site-nav__link"
              href={sectionPath(section.slug, locale)}
              key={section.slug}
            >
              {sectionLabels(section, locale).name}
            </Link>
          ))}
          {/* Search is per language: each locale has its own page over its own
              generated index, so a German reader searching German articles
              gets German results rather than an English corpus behind a link
              labelled "English". */}
          <Link className="site-nav__link" href={staticPath("search", locale)}>
            {strings(locale).search}
          </Link>
          {/*
            The way back out to the main site, IN THE READER'S LANGUAGE.
            MEASURED IN THE CRAWL: it was `mainSiteUrl("/")` on every page, so
            the last link in the German header — the one a reader takes to
            leave the Magazine — landed on the English home. The label is the
            domain and stays as it is; the destination is not the domain.
          */}
          <a
            className="site-nav__link site-nav__exit"
            href={mainSiteUrl(mainSiteTarget("/", locale).path).href}
          >
            LogisticID.com
          </a>
        </nav>
      </div>
    </header>
  );
}
