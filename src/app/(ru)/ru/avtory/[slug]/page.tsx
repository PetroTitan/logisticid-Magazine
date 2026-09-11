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

const ui = strings("ru");

export function generateStaticParams() {
  return authors.map((author) => ({ slug: author.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (author === undefined) return {};

  return pageMetadata({
    path: authorPath(author.slug, "ru"),
    locale: "ru",
    title: authorLabels(author, "ru").name,
    description: authorLabels(author, "ru").bio,
    languages: authorAlternates(author.slug),
  });
}

/**
 * A byline's Russian page.
 *
 * `publicArticles("ru")` — the list under a Russian byline is the Russian work.
 * Listing the English articles here would put English cards under a Russian
 * heading and, worse, present a corpus as this byline's Russian output when it
 * is not.
 */
export default async function RussianAuthorPage({ params }: Params) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (author === undefined) notFound();

  const labels = authorLabels(author, "ru");
  const written = publicArticles("ru").filter((article) => article.authors.includes(author.slug));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl(mainSiteTarget("/", "ru").path).href },
          /*
           * The SAME string the visible breadcrumb shows. Structured data that
           * names a step differently from the trail on the page describes a
           * hierarchy the reader cannot see, and the guidance for
           * `BreadcrumbList` is explicit that the name should be the visible
           * one. It was `site.name` — "LogisticID Magazine" — under a visible
           * crumb reading "Magazine", and under a German one reading "Magazin".
           */
          { name: ui.magazineCrumb, url: magazineUrl(indexPath("ru")).href },
          { name: ui.authors, url: magazineUrl(staticPath("authors", "ru")).href },
          { name: labels.name, url: magazineUrl(authorPath(author.slug, "ru")).href },
        ])}
      />

      <div className="shell page">
        <Breadcrumbs
          locale="ru"
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl(mainSiteTarget("/", "ru").path).href },
            { label: ui.magazineCrumb, href: indexPath("ru") },
            { label: ui.authors, href: staticPath("authors", "ru") },
            { label: labels.name },
          ]}
        />
        <p className="page__eyebrow">{labels.role}</p>
        <h1 className="page__title">{labels.name}</h1>
        <p className="page__standfirst">{labels.bio}</p>

        <LanguageSwitcher
          cluster={{ en: authorPath(author.slug, "en"), de: authorPath(author.slug, "ru") }}
          locale="ru"
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
