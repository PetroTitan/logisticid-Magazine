import Link from "next/link";

import { strings } from "@/config/ui-strings";
import { sectionLabels, sections } from "@/content/sections";
import { articlesInSection } from "@/lib/corpus";
import { indexPath, sectionPath, staticPath } from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { mainSiteUrl } from "@/lib/site";

export const metadata = {
  title: "Seite nicht gefunden",
  robots: { index: false, follow: true },
};

const ui = strings("de");

/**
 * The German 404, so a missing German URL answers in German.
 *
 * It must return a real HTTP 404 rather than a 200 with apologetic text, and
 * it must never fall back to the English article at a similar address: a soft
 * 404 keeps a dead URL in the index, and an English fallback under a German
 * path is the duplicate-content failure the whole locale split prevents.
 *
 * The sections it offers are the ones that actually hold a German article.
 * Offering all three would send a reader who has just hit a dead end to a
 * second one.
 */
export default function GermanNotFound() {
  const populated = sections.filter(
    (section) => articlesInSection(section.slug, "de").length > 0,
  );

  return (
    <div className="shell page">
      <p className="page__eyebrow">404</p>
      <h1 className="page__title">{ui.notFoundTitle}</h1>
      <p className="page__standfirst">
        {ui.notFoundStandfirst}{" "}
        <Link href={staticPath("corrections", "de")}>{ui.notFoundCorrectionsLinkText}</Link>.
      </p>

      <section aria-labelledby="notfound-sections" className="article__aside">
        <h2 id="notfound-sections">{ui.notFoundTryThese}</h2>
        <ul className="linked-list">
          <li>
            <Link href={indexPath("de")}>{ui.notFoundHome}</Link>
          </li>
          {populated.map((section) => (
            <li key={section.slug}>
              <Link href={sectionPath(section.slug, "de")}>
                {sectionLabels(section, "de").name}
              </Link>
            </li>
          ))}
          <li>
            <Link href={staticPath("search", "de")}>{ui.notFoundSearch}</Link>
          </li>
          <li>
            <a href={mainSiteUrl(mainSiteTarget("/", "de").path).href}>{ui.notFoundMainSite}</a>
          </li>
        </ul>
      </section>
    </div>
  );
}
