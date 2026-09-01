import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { authors } from "@/content/authors";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl, site } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/authors",
  title: "Authors",
  description: "Who writes LogisticID Magazine, and how articles are attributed.",
});

export default function AuthorsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl("/").href },
          { name: site.name, url: magazineUrl("/").href },
          { name: "Authors", url: magazineUrl("/authors").href },
        ])}
      />

      <div className="shell page">
        <Breadcrumbs
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl("/").href },
            { label: "Magazine", href: "/" },
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

        <ul className="section-grid">
          {authors.map((author) => (
            <li className="section-card" key={author.slug}>
              <h2>
                <Link href={`/authors/${author.slug}`}>{author.name}</Link>
              </h2>
              <p>{author.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
