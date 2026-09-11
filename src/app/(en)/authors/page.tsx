import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { strings } from "@/config/ui-strings";
import { authorLabels, authors } from "@/content/authors";
import { LanguageSwitcher } from "@/components/language-switcher";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { indexPath, magazineStaticRoutes } from "@/lib/localized-routes";
import { staticAlternates } from "@/lib/localized-routes";
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl } from "@/lib/site";

const ui = strings("en");

export const metadata = pageMetadata({
  path: "/authors",
  title: "Authors",
  description: "Who writes LogisticID Magazine, and how articles are attributed.",
  languages: staticAlternates("authors"),
});

export default function AuthorsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl("/").href },
          /*
           * The SAME string the visible breadcrumb shows. Structured data that
           * names a step differently from the trail on the page describes a
           * hierarchy the reader cannot see, and the guidance for
           * `BreadcrumbList` is explicit that the name should be the visible
           * one. It was `site.name` — "LogisticID Magazine" — under a visible
           * crumb reading "Magazine", and under a German one reading "Magazin".
           */
          { name: ui.magazineCrumb, url: magazineUrl("/").href },
          { name: "Authors", url: magazineUrl("/authors").href },
        ])}
      />

      <div className="shell page">
        <Breadcrumbs
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl("/").href },
            { label: ui.magazineCrumb, href: indexPath("en") },
            { label: "Authors" },
          ]}
        />
        <h1 className="page__title">Authors</h1>
        <p className="page__standfirst">
          LogisticID does not yet publish individual colleague profiles, so articles are attributed
          to the editorial team as an organisation rather than to a named writer. Attributing them
          to an invented person would put fictional expertise behind guidance about freight,
          customs and compliance. Named bylines will appear here when real colleagues are published.
        </p>

        <LanguageSwitcher cluster={magazineStaticRoutes.authors} locale="en" />

        <ul className="section-grid">
          {authors.map((author) => (
            <li className="section-card" key={author.slug}>
              <h2>
                <Link href={`/authors/${author.slug}`}>{authorLabels(author, "en").name}</Link>
              </h2>
              <p>{authorLabels(author, "en").role}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
