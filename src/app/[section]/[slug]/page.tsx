import { Fragment } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { Prose } from "@/components/prose";
import { References } from "@/components/references";
import { getAuthor } from "@/content/authors";
import { getSection } from "@/content/sections";
import type { Article, RelatedLogisticIDEntity } from "@/content/types";
import { articleById, findArticle, publicArticles } from "@/lib/corpus";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl, site } from "@/lib/site";

type Params = { params: Promise<{ section: string; slug: string }> };

export function generateStaticParams() {
  return publicArticles().map((article) => ({
    section: article.section,
    slug: article.slug,
  }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params) {
  const { section, slug } = await params;
  const article = findArticle(section, slug);
  if (article === undefined) return {};

  return pageMetadata({
    path: `/${article.section}/${article.slug}`,
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.description,
    ...(article.socialTitle === undefined ? {} : { socialTitle: article.socialTitle }),
    ...(article.socialDescription === undefined
      ? {}
      : { socialDescription: article.socialDescription }),
    openGraph: {
      type: "article",
      publishedTime: article.datePublished,
      ...(article.dateModified === undefined ? {} : { modifiedTime: article.dateModified }),
    },
  });
}

/** Label and destination for a link back to the main LogisticID site. */
function relatedTarget(entity: RelatedLogisticIDEntity): { label: string; href: string } {
  switch (entity.type) {
    case "service": {
      const names = {
        ftl: "Full truckload (FTL)",
        ltl: "Part load (LTL)",
        express: "Express freight",
        pallets: "Pallet freight",
      } as const;
      return {
        label: names[entity.slug],
        href: mainSiteUrl(`/road-freight/${entity.slug}`).href,
      };
    }
    case "audience":
      return {
        label: entity.slug === "shippers" ? "LogisticID for shippers" : "LogisticID for carriers",
        href: mainSiteUrl(`/${entity.slug}`).href,
      };
    case "page": {
      /**
       * Named pages get their real names. This used to interpolate the path,
       * so an article that pointed at the quote form rendered a link reading
       * "LogisticID /request-a-quote" — a URL shown to a reader as though it
       * were a title. Anything not named here still falls back to the path,
       * which is ugly but honest, and visible enough that somebody adds it.
       */
      const names: Readonly<Record<string, string>> = {
        "/": "LogisticID",
        "/request-a-quote": "Request a freight quote",
        "/road-freight": "European road freight",
        "/freight-forwarding": "Freight forwarding",
        "/services": "Freight services",
      };
      return {
        label: names[entity.path] ?? `LogisticID ${entity.path}`,
        href: mainSiteUrl(entity.path).href,
      };
    }
  }
}

/**
 * Whether this article should offer a route to the quote form.
 *
 * Derived from the article's own `relatedLogisticID` mapping rather than
 * printed on every page: an article that maps to a road service, or to the
 * shipper audience, is about arranging freight, and a reader who has just
 * finished it may well want to arrange some. An article about how the
 * publication sources its information is not, and putting a quote button on it
 * would be the advertorial drift §92 warns about.
 *
 * So the rule is one line and the data decides. Nothing to duplicate per
 * article, and an article that changes subject changes its own CTA.
 */
function invitesAQuote(article: Article): boolean {
  return article.relatedLogisticID.some(
    (entity) =>
      entity.type === "service" ||
      (entity.type === "audience" && entity.slug === "shippers"),
  );
}

function Byline({ article }: { article: Article }) {
  return (
    <p className="article__byline">
      <span>
        By{" "}
        {article.authors.map((slug, index) => {
          const author = getAuthor(slug);
          // A Fragment rather than a wrapping span: the byline is one
          // sentence, and wrapping each link in its own element made an
          // inline link look like a standalone control to assistive
          // technology and to target-size tooling alike.
          return (
            <Fragment key={slug}>
              {index > 0 ? ", " : ""}
              <Link href={`/authors/${slug}`}>{author?.name ?? slug}</Link>
            </Fragment>
          );
        })}
      </span>
      <span>
        Published <time dateTime={article.datePublished}>{article.datePublished}</time>
      </span>
      {article.dateModified === undefined ? null : (
        <span>
          Updated <time dateTime={article.dateModified}>{article.dateModified}</time>
        </span>
      )}
      <span>{article.readingTime} min read</span>
      {article.jurisdiction === undefined ? null : <span>Applies to: {article.jurisdiction}</span>}
      {article.informationCurrentAsOf === undefined ? null : (
        <span>
          Position checked{" "}
          <time dateTime={article.informationCurrentAsOf}>{article.informationCurrentAsOf}</time>
        </span>
      )}
    </p>
  );
}

export default async function ArticlePage({ params }: Params) {
  const { section: sectionSlug, slug } = await params;
  const article = findArticle(sectionSlug, slug);
  if (article === undefined) notFound();

  const section = getSection(article.section);
  const related = article.relatedArticles
    .map(articleById)
    .filter((entry): entry is Article => entry !== undefined);

  return (
    <>
      <JsonLd data={articleJsonLd(article)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl("/").href },
          { name: site.name, url: magazineUrl("/").href },
          ...(section === undefined
            ? []
            : [{ name: section.name, url: magazineUrl(`/${section.slug}`).href }]),
          {
            name: article.title,
            url: magazineUrl(`/${article.section}/${article.slug}`).href,
          },
        ])}
      />

      <article className="shell article">
        <Breadcrumbs
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl("/").href },
            { label: "Magazine", href: "/" },
            ...(section === undefined
              ? []
              : [{ label: section.name, href: `/${section.slug}` }]),
            { label: article.title },
          ]}
        />

        <header className="article__header">
          <p className="page__eyebrow">{section?.name ?? article.section}</p>
          <h1 className="article__title">{article.title}</h1>
          <p className="article__standfirst">{article.subtitle}</p>
          <Byline article={article} />
        </header>

        {article.correctionNote === undefined ? null : (
          <div className="correction" role="note">
            <span className="correction__label">Correction</span>
            <p>{article.correctionNote}</p>
          </div>
        )}

        {article.heroImage === undefined ? null : (
          <figure className="article__hero">
            {/* A plain <img> rather than next/image: the Magazine ships static
                HTML and this avoids a runtime image optimiser on the critical
                path. Width and height are required by the schema, so the space
                is reserved and the image cannot shift the layout. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={article.heroImage.alt}
              height={article.heroImage.height}
              src={article.heroImage.src}
              width={article.heroImage.width}
            />
            <figcaption>
              {article.heroImage.illustrative === true ? (
                <span className="article__illustrative">Illustration</span>
              ) : null}
              {article.heroImage.credit} &middot; {article.heroImage.license}
            </figcaption>
          </figure>
        )}

        <Prose blocks={article.body} sources={article.sources} />

        <References sources={article.sources} />

        {article.updateHistory.length === 0 ? null : (
          <section aria-labelledby="updates-heading" className="article__aside">
            <h2 id="updates-heading">Update history</h2>
            <ul className="linked-list">
              {article.updateHistory.map((update) => (
                <li key={update.date}>
                  <time dateTime={update.date}>{update.date}</time> — {update.note}
                </li>
              ))}
            </ul>
          </section>
        )}

        {article.relatedLogisticID.length === 0 ? null : (
          <section aria-labelledby="services-heading" className="article__aside">
            <h2 id="services-heading">On the LogisticID website</h2>
            <ul className="linked-list">
              {article.relatedLogisticID
                .filter((entity) => !(entity.type === "page" && entity.path === "/request-a-quote"))
                .map((entity, index) => {
                  const target = relatedTarget(entity);
                  return (
                    <li key={index}>
                      <a href={target.href}>{target.label}</a>
                    </li>
                  );
                })}
            </ul>
            {/*
              The commercial route out, shown only where the article's own
              mapping says the subject is arranging freight. Filtered out of
              the list above first, so an article that names the quote form
              explicitly does not get it twice.
            */}
            {invitesAQuote(article) && (
              <p className="article__quote-path">
                Have a shipment that needs arranging?{" "}
                <a href={mainSiteUrl("/request-a-quote").href}>
                  Send the route, cargo and dates
                </a>{" "}
                and a person at LogisticID will review it.
              </p>
            )}
          </section>
        )}

        {related.length === 0 ? null : (
          <section aria-labelledby="related-heading" className="article__aside">
            <h2 id="related-heading">Related reading</h2>
            <ul className="linked-list">
              {related.map((entry) => (
                <li key={entry.id}>
                  <Link href={`/${entry.section}/${entry.slug}`}>{entry.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  );
}
