import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/article-card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { strings } from "@/config/ui-strings";
import { authorLabels, authors, getAuthor } from "@/content/authors";
import { publicArticles } from "@/lib/corpus";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { authorAlternates, authorPath, indexPath } from "@/lib/localized-routes";
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

const ui = strings("en");

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
    title: authorLabels(author, "en").name,
    description: authorLabels(author, "en").bio,
    languages: authorAlternates(author.slug),
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
          { name: authorLabels(author, "en").name, url: magazineUrl(`/authors/${author.slug}`).href },
        ])}
      />

      <div className="shell page">
        <Breadcrumbs
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl("/").href },
            { label: ui.magazineCrumb, href: indexPath("en") },
            { label: "Authors", href: "/authors" },
            { label: authorLabels(author, "en").name },
          ]}
        />
        <p className="page__eyebrow">{authorLabels(author, "en").role}</p>
        <h1 className="page__title">{authorLabels(author, "en").name}</h1>
        <p className="page__standfirst">{authorLabels(author, "en").bio}</p>

        <LanguageSwitcher
          cluster={{
            en: authorPath(author.slug, "en"),
            de: authorPath(author.slug, "de"),
          }}
          locale="en"
        />

        {written.length === 0 ? (
          <p className="empty-state">{ui.noArticlesForByline}</p>
        ) : (
          <>
            {/* Without this the page jumps from h1 straight to the h3 of the
                first card, which is a heading-order skip for anyone
                navigating by headings. */}
            <h2 className="sr-only">{ui.articlesHeading}</h2>
            <ul className="article-list">
            {written.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
