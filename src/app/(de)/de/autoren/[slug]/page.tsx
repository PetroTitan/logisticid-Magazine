import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/article-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { LanguageSwitcher } from "@/components/language-switcher";
import { strings } from "@/config/ui-strings";
import { authorLabels, authors, getAuthor } from "@/content/authors";
import { publicArticles } from "@/lib/corpus";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { authorAlternates, authorPath, indexPath, staticPath } from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

const ui = strings("de");

export function generateStaticParams() {
  return authors.map((author) => ({ slug: author.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (author === undefined) return {};

  return pageMetadata({
    path: authorPath(author.slug, "de"),
    locale: "de",
    title: authorLabels(author, "de").name,
    description: authorLabels(author, "de").bio,
    languages: authorAlternates(author.slug),
  });
}

/**
 * A byline's German page.
 *
 * `publicArticles("de")` — the list under a German byline is the German work.
 * Listing the English articles here would put English cards under a German
 * heading and, worse, present a corpus as this byline's German output when it
 * is not.
 */
export default async function GermanAuthorPage({ params }: Params) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (author === undefined) notFound();

  const labels = authorLabels(author, "de");
  const written = publicArticles("de").filter((article) => article.authors.includes(author.slug));

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
          { name: labels.name, url: magazineUrl(authorPath(author.slug, "de")).href },
        ])}
      />

      <div className="shell page">
        <Breadcrumbs
          locale="de"
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl(mainSiteTarget("/", "de").path).href },
            { label: ui.magazineCrumb, href: indexPath("de") },
            { label: ui.authors, href: staticPath("authors", "de") },
            { label: labels.name },
          ]}
        />
        <p className="page__eyebrow">{labels.role}</p>
        <h1 className="page__title">{labels.name}</h1>
        <p className="page__standfirst">{labels.bio}</p>

        <LanguageSwitcher
          cluster={{ en: authorPath(author.slug, "en"), de: authorPath(author.slug, "de") }}
          locale="de"
        />

        {written.length === 0 ? (
          <p className="empty-state">{ui.noArticlesForByline}</p>
        ) : (
          <>
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
