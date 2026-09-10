import Link from "next/link";

import { ArticleCard } from "@/components/article-card";
import { JsonLd } from "@/components/json-ld";
import { sections } from "@/content/sections";
import { publicArticles } from "@/lib/corpus";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl, site } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/",
  title: site.name,
  description: site.tagline,
});

export default function HomePage() {
  const articles = publicArticles();
  // Ordering is by publication date, which is a fact. Nothing here is sorted
  // by popularity, "trending" or a recommendation score: none of those is
  // measured, and presenting an arbitrary order as one of them would be a
  // claim about readership the publication cannot support.
  const [lead, ...rest] = articles;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl("/").href },
          { name: site.name, url: magazineUrl("/").href },
        ])}
      />

      <div className="shell page">
        <p className="page__eyebrow">LogisticID Magazine</p>
        <h1 className="page__title">{site.tagline}</h1>
        <p className="page__standfirst">
          Explanations of how European road freight actually works, written for the people who have
          to arrange it. Every factual claim is sourced, and every article says where its guidance
          stops and a shipment-specific assessment begins.
        </p>

        {lead === undefined ? (
          <p className="empty-state">No articles have been published yet.</p>
        ) : (
          <>
            {/* Structures the page for a screen reader without repeating a
                heading the visual hierarchy already makes obvious. */}
            <h2 className="sr-only">Latest articles</h2>
            <ul className="article-list">
              <ArticleCard article={lead} />
              {rest.map((article) => (
                <ArticleCard article={article} key={article.id} />
              ))}
            </ul>
          </>
        )}

        <section aria-labelledby="sections-heading" className="article__aside">
          <h2 id="sections-heading">Sections</h2>
          <ul className="section-grid">
            {sections.map((section) => (
              <li className="section-card" key={section.slug}>
                <h3>
                  <Link href={`/${section.slug}`}>{section.name}</Link>
                </h3>
                <p>{section.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
