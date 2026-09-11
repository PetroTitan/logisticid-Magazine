import Link from "next/link";

import { strings } from "@/config/ui-strings";
import { sectionLabels, sections } from "@/content/sections";
import { indexPath, sectionPath, staticPath } from "@/lib/localized-routes";
import { mainSiteUrl } from "@/lib/site";

const ui = strings("en");

/**
 * The Magazine's own 404.
 *
 * It must return a real HTTP 404 rather than a 200 with apologetic text: a
 * soft 404 keeps a dead URL in the index and tells a crawler the page exists.
 * Next.js sets the status for this file automatically; `tests/routing` asserts
 * the behaviour so a future refactor cannot quietly turn it into a 200.
 */
export default function NotFound() {
  return (
    <div className="shell page">
      <p className="page__eyebrow">404</p>
      <h1 className="page__title">{ui.notFoundTitle}</h1>
      <p className="page__standfirst">
        {ui.notFoundStandfirst}{" "}
        <Link href={staticPath("corrections", "en")}>{ui.notFoundCorrectionsLinkText}</Link>.
      </p>

      <section aria-labelledby="notfound-sections" className="article__aside">
        <h2 id="notfound-sections">{ui.notFoundTryThese}</h2>
        <ul className="linked-list">
          <li>
            <Link href={indexPath("en")}>{ui.notFoundHome}</Link>
          </li>
          {sections.map((section) => (
            <li key={section.slug}>
              <Link href={sectionPath(section.slug, "en")}>
                {sectionLabels(section, "en").name}
              </Link>
            </li>
          ))}
          <li>
            <Link href={staticPath("search", "en")}>{ui.notFoundSearch}</Link>
          </li>
          <li>
            <a href={mainSiteUrl("/").href}>{ui.notFoundMainSite}</a>
          </li>
        </ul>
      </section>
    </div>
  );
}
