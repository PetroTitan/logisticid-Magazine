import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/article-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { getSection, sections } from "@/content/sections";
import { articlesInSection } from "@/lib/corpus";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl, site } from "@/lib/site";

type Params = { params: Promise<{ section: string }> };

/**
 * Only registered sections are generated. Combined with `dynamicParams = false`
 * this makes any other path a real 404 rather than a page rendered on demand
 * for a URL the publication does not have.
 */
export function generateStaticParams() {
  return sections.map((section) => ({ section: section.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params) {
  const { section: slug } = await params;
  const section = getSection(slug);
  if (section === undefined) return {};

  return pageMetadata({
    path: `/${section.slug}`,
    title: section.name,
    description: section.description,
  });
}

export default async function SectionPage({ params }: Params) {
  const { section: slug } = await params;
  const section = getSection(slug);
  if (section === undefined) notFound();

  const articles = articlesInSection(section.slug);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl("/").href },
          { name: site.name, url: magazineUrl("/").href },
          { name: section.name, url: magazineUrl(`/${section.slug}`).href },
        ])}
      />

      <div className="shell page">
        <Breadcrumbs
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl("/").href },
            { label: "Magazine", href: "/" },
            { label: section.name },
          ]}
        />
        <p className="page__eyebrow">Section</p>
        <h1 className="page__title">{section.name}</h1>
        <p className="page__standfirst">{section.intro}</p>

        {articles.length === 0 ? (
          <p className="empty-state">No articles have been published in this section yet.</p>
        ) : (
          <>
            {/* Without this the page jumps from h1 straight to the h3 of the
                first card, which is a heading-order skip for anyone
                navigating by headings. */}
            <h2 className="sr-only">Articles</h2>
            <ul className="article-list">
            {articles.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
