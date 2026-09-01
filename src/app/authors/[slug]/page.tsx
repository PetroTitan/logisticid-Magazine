import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/article-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { authors, getAuthor } from "@/content/authors";
import { publicArticles } from "@/lib/corpus";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl, site } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return authors.map((author) => ({ slug: author.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (author === undefined) return {};

  return pageMetadata({
    path: `/authors/${author.slug}`,
    title: author.name,
    description: author.bio,
  });
}

export default async function AuthorPage({ params }: Params) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (author === undefined) notFound();

  const written = publicArticles().filter((article) => article.authors.includes(author.slug));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl("/").href },
          { name: site.name, url: magazineUrl("/").href },
          { name: "Authors", url: magazineUrl("/authors").href },
          { name: author.name, url: magazineUrl(`/authors/${author.slug}`).href },
        ])}
      />

      <div className="shell page">
        <Breadcrumbs
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl("/").href },
            { label: "Magazine", href: "/" },
            { label: "Authors", href: "/authors" },
            { label: author.name },
          ]}
        />
        <p className="page__eyebrow">{author.role}</p>
        <h1 className="page__title">{author.name}</h1>
        <p className="page__standfirst">{author.bio}</p>

        {written.length === 0 ? (
          <p className="empty-state">No published articles carry this byline yet.</p>
        ) : (
          <ul className="article-list">
            {written.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
