import Link from "next/link";

import { sections } from "@/content/sections";
import { mainSiteUrl, site } from "@/lib/site";

/**
 * The Magazine footer.
 *
 * It carries the editorial policies, the machine-readable feeds and the routes
 * back to the main site. The policies are in the footer of every page rather
 * than linked once from an "about" page because they are the basis on which a
 * reader should judge everything above them.
 */
export function SiteFooter() {
  const year = new Date().getUTCFullYear();

  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="site-footer__grid">
          <div>
            <h2 className="site-footer__heading">Sections</h2>
            <ul className="site-footer__list">
              {sections.map((section) => (
                <li key={section.slug}>
                  <Link href={`/${section.slug}`}>{section.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="site-footer__heading">Editorial standards</h2>
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
            <h2 className="site-footer__heading">Follow</h2>
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

        <p className="site-footer__note">
          {site.name} is published by {site.parentName}. It is written to explain how European
          road freight works. It is general information and reporting, not advice on a particular
          shipment — see the{" "}
          <Link href="/editorial-policy">editorial policy</Link> for what that means in practice.
          {" "}&copy; {year} {site.parentName}.
        </p>
      </div>
    </footer>
  );
}
