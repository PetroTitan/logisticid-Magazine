import Link from "next/link";

import { sections } from "@/content/sections";
import { defaultLocale, type Locale } from "@/config/locales";
import { strings } from "@/config/ui-strings";
import { articlesInSection } from "@/lib/corpus";
import { sectionPath } from "@/lib/localized-routes";
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
                  <Link href={sectionPath(section.slug, locale)}>{section.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="site-footer__heading">{ui.editorialStandards}</h2>
            <ul className="site-footer__list">
              <li>
                <Link href="/editorial-policy">Editorial policy</Link>
              </li>
              <li>
                <Link href="/sourcing-policy">Sourcing policy</Link>
              </li>
              <li>
                <Link href="/image-policy">Image and AI policy</Link>
              </li>
              <li>
                <Link href="/corrections">Corrections</Link>
              </li>
              <li>
                <Link href="/authors">Authors</Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="site-footer__heading">{ui.follow}</h2>
            <ul className="site-footer__list">
              <li>
                <Link href="/rss.xml">RSS feed</Link>
              </li>
              <li>
                <Link href="/atom.xml">Atom feed</Link>
              </li>
              <li>
                <Link href="/feed.json">JSON Feed</Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="site-footer__heading">LogisticID</h2>
            <ul className="site-footer__list">
              <li>
                <a href={mainSiteUrl("/").href}>Home</a>
              </li>
              <li>
                <a href={mainSiteUrl("/road-freight").href}>Road freight</a>
              </li>
              <li>
                <a href={mainSiteUrl("/shippers").href}>For shippers</a>
              </li>
              <li>
                <a href={mainSiteUrl("/carriers").href}>For carriers</a>
              </li>
              <li>
                <a href={mainSiteUrl("/contact").href}>Contact</a>
              </li>
            </ul>
          </div>
        </div>

        {localized ? (
          <p className="site-footer__note">
            {site.name} {ui.publishedBy} {site.parentName}. Die Beiträge erklären, wie
            europäischer Straßengüterverkehr funktioniert. Sie sind allgemeine
            Information und Berichterstattung, keine Beratung zu einer konkreten
            Sendung.{" "}
            {ui.readInEnglishNote}{" "}
            <Link href="/editorial-policy" hrefLang="en" lang="en">
              Editorial policy
            </Link>
            .
          </p>
        ) : (
          <p className="site-footer__note">
            {site.name} is published by {site.parentName}. It is written to explain how European
            road freight works. It is general information and reporting, not advice on a particular
            shipment — see the{" "}
            <Link href="/editorial-policy">editorial policy</Link> for what that means in practice.
          </p>
        )}

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
