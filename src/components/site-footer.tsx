import Link from "next/link";

import { sectionLabels, sections } from "@/content/sections";
import { defaultLocale, type Locale } from "@/config/locales";
import { strings } from "@/config/ui-strings";
import { articlesInSection } from "@/lib/corpus";
import { sectionPath, staticPath } from "@/lib/localized-routes";
import { FOREIGN_LANGUAGE_MARKER, mainSiteTarget } from "@/lib/main-site-links";
import { publisher } from "@/config/publisher";
import { mainSiteUrl, site } from "@/lib/site";

/**
 * The Magazine footer.
 *
 * It carries the editorial policies, the machine-readable feeds and the routes
 * back to the main site. The policies are in the footer of every page rather
 * than linked once from an "about" page because they are the basis on which a
 * reader should judge everything above them.
 */
export function SiteFooter({ locale = defaultLocale }: { locale?: Locale } = {}) {
  const year = new Date().getUTCFullYear();
  const ui = strings(locale);
  const localized = locale !== defaultLocale;
  const visibleSections = localized
    ? sections.filter((section) => articlesInSection(section.slug, locale).length > 0)
    : sections;

  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="site-footer__grid">
          <div>
            <h2 className="site-footer__heading">{ui.sections}</h2>
            <ul className="site-footer__list">
              {visibleSections.map((section) => (
                <li key={section.slug}>
                  <Link href={sectionPath(section.slug, locale)}>{sectionLabels(section, locale).name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {/*
              The editorial standards, in the reader's language. Until Phase 4T
              these were five English links under a German heading, marked with
              a note saying so — honest while the pages existed only in
              English, and a stale marker the moment they did not. Every one of
              them now resolves through the route table, so the language of the
              destination follows the language of the page by construction.
            */}
            <h2 className="site-footer__heading">{ui.editorialStandards}</h2>
            <ul className="site-footer__list">
              <li>
                <Link href={staticPath("editorial-policy", locale)}>{ui.editorialPolicy}</Link>
              </li>
              <li>
                <Link href={staticPath("sourcing-policy", locale)}>{ui.sourcingPolicy}</Link>
              </li>
              <li>
                <Link href={staticPath("image-policy", locale)}>{ui.imagePolicy}</Link>
              </li>
              <li>
                <Link href={staticPath("corrections", locale)}>{ui.corrections}</Link>
              </li>
              <li>
                <Link href={staticPath("authors", locale)}>{ui.authors}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="site-footer__heading">{ui.follow}</h2>
            <ul className="site-footer__list">
              <li>
                <Link href={staticPath("rss", locale)}>{ui.rssFeed}</Link>
              </li>
              <li>
                <Link href={staticPath("atom", locale)}>{ui.atomFeed}</Link>
              </li>
              <li>
                <Link href={staticPath("json-feed", locale)}>{ui.jsonFeed}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="site-footer__heading">LogisticID</h2>
            <ul className="site-footer__list">
              {/*
                `/shippers` and `/carriers` carried `hrefLang="en"` and an
                English label here because the main site had no German version
                of either. Phase 4S-B1 published `/de/versender` and
                `/de/transportunternehmen`, and the marker went on saying
                otherwise. It now comes from the route mirror, which is the
                only thing that knows.
              */}
              {(
                [
                  ["/", ui.mainHome],
                  ["/road-freight", ui.mainRoadFreight],
                  ["/shippers", ui.mainShippers],
                  ["/carriers", ui.mainCarriers],
                  ["/contact", ui.mainContact],
                ] as const
              ).map(([path, label]) => {
                const target = mainSiteTarget(path, locale);
                return (
                  <li key={path}>
                    <a
                      href={mainSiteUrl(target.path).href}
                      {...(target.foreignLanguage ? { hrefLang: "en", lang: "en" } : {})}
                    >
                      {label}
                      {target.foreignLanguage ? FOREIGN_LANGUAGE_MARKER[locale] : ""}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/*
          THE STANDING NOTE, IN THE READER'S LANGUAGE AND LINKING TO THE
          READER'S PAGE.
          
          This was `localized ? <German> : <English>`, which is correct with
          two languages and put a GERMAN paragraph — linking to
          `/magazine/de/redaktionsrichtlinien` — at the foot of every Russian
          page. Nothing failed: the German branch is selected for any locale
          that is not the default, and the page renders. The crawl found it
          because it follows links rather than reading the source.
          
          The link is resolved through the route table for `locale`, so the
          sentence and its destination cannot be in different languages.
        */}
        <p className="site-footer__note">
          {locale === "de" ? (
            <>
              {site.name} {ui.publishedBy} {site.parentName}. Die Beiträge erklären, wie
              europäischer Straßengüterverkehr funktioniert. Sie sind allgemeine
              Information und Berichterstattung, keine Beratung zu einer konkreten
              Sendung — was das in der Praxis bedeutet, steht in den{" "}
              <Link href={staticPath("editorial-policy", locale)}>{ui.editorialPolicy}</Link>.
            </>
          ) : locale === "ru" ? (
            <>
              {site.name} {ui.publishedBy} {site.parentName}. Материалы объясняют,
              как работают европейские автомобильные грузоперевозки. Это общая
              информация и разборы, а не консультация по конкретной отправке —
              что это значит на практике, изложено в разделе{" "}
              <Link href={staticPath("editorial-policy", locale)}>{ui.editorialPolicy}</Link>.
            </>
          ) : (
            <>
              {site.name} is published by {site.parentName}. It is written to explain how European
              road freight works. It is general information and reporting, not advice on a
              particular shipment — see the{" "}
              <Link href={staticPath("editorial-policy", locale)}>editorial policy</Link> for what
              that means in practice.
            </>
          )}
        </p>

        {/*
          The same legal line the main site's footer carries, and for the same
          reason: two applications serve one hostname for one company, and a
          reader who finds the entity named in one place and only the brand in
          the other cannot tell which page they are on the hook to.

          Entity and number only. The registered office is a seat for service
          of documents, not a place anyone visits, and a street address under a
          masthead reads as an editorial office.
        */}
        <p className="site-footer__note">
          &copy; {year} {publisher.legalName} &middot; IČO {publisher.registrationNumber}
        </p>
      </div>
    </footer>
  );
}
