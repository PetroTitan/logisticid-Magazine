import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { LanguageSwitcher } from "@/components/language-switcher";
import { strings } from "@/config/ui-strings";
import { authorLabels, authors } from "@/content/authors";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import {
  authorPath,
  indexPath,
  magazineStaticRoutes,
  staticAlternates,
  staticPath,
} from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl } from "@/lib/site";

const ui = strings("de");

export const metadata = pageMetadata({
  path: staticPath("authors", "de"),
  locale: "de",
  title: "Autoren",
  description: "Wer LogisticID Magazine schreibt und wie Beiträge zugeschrieben werden.",
  languages: staticAlternates("authors"),
});

export default function GermanAuthorsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl(mainSiteTarget("/", "de").path).href },
          /*
           * The SAME string the visible breadcrumb shows. Structured data that
           * names a step differently from the trail on the page describes a
           * hierarchy the reader cannot see, and the guidance for
           * `BreadcrumbList` is explicit that the name should be the visible
           * one. It was `site.name` — "LogisticID Magazine" — under a visible
           * crumb reading "Magazine", and under a German one reading "Magazin".
           */
          { name: ui.magazineCrumb, url: magazineUrl(indexPath("de")).href },
          { name: ui.authors, url: magazineUrl(staticPath("authors", "de")).href },
        ])}
      />

      <div className="shell page">
        <Breadcrumbs
          locale="de"
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl(mainSiteTarget("/", "de").path).href },
            { label: ui.magazineCrumb, href: indexPath("de") },
            { label: ui.authors },
          ]}
        />
        <h1 className="page__title">{ui.authors}</h1>
        <p className="page__standfirst">
          LogisticID veröffentlicht bislang keine Profile einzelner Mitarbeiterinnen und
          Mitarbeiter. Die Beiträge sind deshalb der Redaktion als Organisation zugeschrieben und
          nicht einer namentlich genannten Person. Sie einer erfundenen Person zuzuschreiben würde
          fiktive Fachkunde hinter Hinweise zu Transport, Zoll und Regelkonformität stellen.
          Namentliche Autorenzeilen erscheinen hier, sobald reale Kolleginnen und Kollegen
          veröffentlicht werden.
        </p>

        <LanguageSwitcher cluster={magazineStaticRoutes.authors} locale="de" />

        <ul className="section-grid">
          {authors.map((author) => (
            <li className="section-card" key={author.slug}>
              <h2>
                <Link href={authorPath(author.slug, "de")}>
                  {authorLabels(author, "de").name}
                </Link>
              </h2>
              <p>{authorLabels(author, "de").role}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
