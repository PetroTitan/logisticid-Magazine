import { Fragment } from "react";

import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Prose } from "@/components/prose";
import { References } from "@/components/references";
import { localeDetails, type Locale } from "@/config/locales";
import { strings } from "@/config/ui-strings";
import { authorLabels, getAuthor } from "@/content/authors";
import { getSection, sectionLabels } from "@/content/sections";
import type { Article, RelatedLogisticIDEntity } from "@/content/types";
import { allPublicArticles, articleById } from "@/lib/corpus";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import {
  articleCluster,
  articlePath,
  authorPath,
  indexPath,
  sectionPath,
} from "@/lib/localized-routes";
import { FOREIGN_LANGUAGE_MARKER, mainSiteTarget } from "@/lib/main-site-links";
import { magazineUrl, mainSiteUrl } from "@/lib/site";

/**
 * One article, rendered in the language it was written in.
 *
 * EXTRACTED SO THERE IS NOT A SECOND COPY PER LANGUAGE. Both the English route
 * and the German route are thin wrappers over this: they resolve the article
 * for their own locale and hand it here. A translated copy of a 290-line page
 * component would be two places to fix a heading-order bug, and the second one
 * would be found later.
 *
 * Every visible string that is not the article's own comes from the locale
 * dictionary. The article's title, standfirst and body come from the article
 * file, which is written in its own language.
 */

/** A date in the reader's language: "10 September 2026" / "10. September 2026". */
function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeDetails[locale].formattingLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** Label and destination for a link back to the main LogisticID site. */
function relatedTarget(
  entity: RelatedLogisticIDEntity,
  locale: Locale,
): { label: string; href: string; foreignLanguage: boolean } {
  switch (entity.type) {
    case "service": {
      const names =
        locale === "de"
          ? ({
              ftl: "Komplettladung (FTL)",
              ltl: "Teilladung (LTL)",
              express: "Expressfracht",
              pallets: "Palettenversand",
            } as const)
          : ({
              ftl: "Full truckload (FTL)",
              ltl: "Part load (LTL)",
              express: "Express freight",
              pallets: "Pallet freight",
            } as const);
      const target = mainSiteTarget(`/road-freight/${entity.slug}`, locale);
      return {
        label: names[entity.slug],
        href: mainSiteUrl(target.path).href,
        foreignLanguage: target.foreignLanguage,
      };
    }
    case "audience":
      const target = mainSiteTarget(`/${entity.slug}`, locale);
      return {
        label:
          locale === "de"
            ? entity.slug === "shippers"
              ? "LogisticID für Versender"
              : "LogisticID für Transportunternehmen"
            : entity.slug === "shippers"
              ? "LogisticID for shippers"
              : "LogisticID for carriers",
        href: mainSiteUrl(target.path).href,
        foreignLanguage: target.foreignLanguage,
      };
    case "page": {
      /**
       * Named pages get their real names. This used to interpolate the path,
       * so an article that pointed at the quote form rendered a link reading
       * "LogisticID /request-a-quote" — a URL shown to a reader as though it
       * were a title. Anything not named here still falls back to the path,
       * which is ugly but honest, and visible enough that somebody adds it.
       */
      const names: Readonly<Record<Locale, Readonly<Record<string, string>>>> = {
        en: {
          "/": "LogisticID",
          "/request-a-quote": "Request a freight quote",
          "/road-freight": "European road freight",
          "/freight-forwarding": "Freight forwarding",
          "/services": "Freight services",
        },
        /*
         * German articles link to the GERMAN pages on the main site where one
         * exists. A German article whose "read more" links all cross back into
         * English is the mixed-language navigation the localization exists to
         * avoid, and the reader only discovers it after the click.
         *
         * A path absent here falls back to the English page and its English
         * label, which is honest — the destination really is in English — and
         * visible enough that somebody adds the German one when it is written.
         */
        de: {
          "/": "LogisticID",
          "/request-a-quote": "Frachtanfrage stellen",
          "/road-freight": "Europäischer Straßengüterverkehr",
          "/freight-forwarding": "Spedition",
          "/services": "Frachtleistungen",
        },
      };
      const label = names[locale][entity.path] ?? names.en[entity.path];
      const target = mainSiteTarget(entity.path, locale);
      return {
        label: label ?? `LogisticID ${entity.path}`,
        href: mainSiteUrl(target.path).href,
        foreignLanguage: target.foreignLanguage,
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

function Byline({ article, locale }: { article: Article; locale: Locale }) {
  const ui = strings(locale);
  return (
    <p className="article__byline">
      <span>
        {ui.byline}{" "}
        {article.authors.map((slug, index) => {
          const author = getAuthor(slug);
          // A Fragment rather than a wrapping span: the byline is one
          // sentence, and wrapping each link in its own element made an
          // inline link look like a standalone control to assistive
          // technology and to target-size tooling alike.
          return (
            <Fragment key={slug}>
              {index > 0 ? ", " : ""}
              <Link href={authorPath(slug, locale)}>
                {author === undefined ? slug : authorLabels(author, locale).name}
              </Link>
            </Fragment>
          );
        })}
      </span>
      <span>
        {ui.published}{" "}
        <time dateTime={article.datePublished}>
          {formatDate(article.datePublished, locale)}
        </time>
      </span>
      {article.dateModified === undefined ? null : (
        <span>
          {ui.updated}{" "}
          <time dateTime={article.dateModified}>
            {formatDate(article.dateModified, locale)}
          </time>
        </span>
      )}
      <span>
        {article.readingTime} {ui.minuteRead}
      </span>
      {article.jurisdiction === undefined ? null : (
        <span>
          {ui.appliesTo} {article.jurisdiction}
        </span>
      )}
      {article.informationCurrentAsOf === undefined ? null : (
        <span>
          {ui.positionChecked}{" "}
          <time dateTime={article.informationCurrentAsOf}>
            {formatDate(article.informationCurrentAsOf, locale)}
          </time>
        </span>
      )}
    </p>
  );
}

export function ArticleView({ article, locale }: { article: Article; locale: Locale }) {
  const ui = strings(locale);
  const section = getSection(article.section);
  const related = article.relatedArticles
    .map(articleById)
    .filter((entry): entry is Article => entry !== undefined)
    // Related reading stays inside one language: a "Weiterlesen" list that
    // hands the reader an English article is a language change presented as a
    // recommendation.
    .filter((entry) => entry.locale === article.locale);

  // The same cluster the page's hreflang is built from, so the control and the
  // head cannot disagree about what a translation exists for.
  const cluster = articleCluster(article, allPublicArticles());
  const switcherCluster = Object.fromEntries(
    Object.entries(cluster).map(([code, member]) => [code, articlePath(member)]),
  );

  return (
    <>
      <JsonLd data={articleJsonLd(article)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl(mainSiteTarget("/", locale).path).href },
          /*
           * The SAME string the visible breadcrumb shows. Structured data that
           * names a step differently from the trail on the page describes a
           * hierarchy the reader cannot see, and the guidance for
           * `BreadcrumbList` is explicit that the name should be the visible
           * one. It was `site.name` — "LogisticID Magazine" — under a visible
           * crumb reading "Magazine", and under a German one reading "Magazin".
           */
          { name: ui.magazineCrumb, url: magazineUrl(indexPath(locale)).href },
          ...(section === undefined
            ? []
            : [
                {
                  name: sectionLabels(section, locale).name,
                  url: magazineUrl(sectionPath(section.slug, locale)).href,
                },
              ]),
          { name: article.title, url: magazineUrl(articlePath(article)).href },
        ])}
      />

      <article className="shell article">
        <Breadcrumbs
          locale={locale}
          crumbs={[
            // The trail climbs to the main site IN THE READER'S LANGUAGE. A
            // German page whose breadcrumb root is the English home describes a
            // hierarchy that changes language halfway up.
            { label: "LogisticID", href: mainSiteUrl(mainSiteTarget("/", locale).path).href },
            { label: ui.magazineCrumb, href: indexPath(locale) },
            ...(section === undefined
              ? []
              : [{ label: sectionLabels(section, locale).name, href: sectionPath(section.slug, locale) }]),
            { label: article.title },
          ]}
        />

        <header className="article__header">
          <p className="page__eyebrow">
            {section === undefined ? article.section : sectionLabels(section, locale).name}
          </p>
          <h1 className="article__title">{article.title}</h1>
          <p className="article__standfirst">{article.subtitle}</p>
          <Byline article={article} locale={locale} />
          <LanguageSwitcher cluster={switcherCluster} locale={locale} />
        </header>

        {article.correctionNote === undefined ? null : (
          <div className="correction" role="note">
            <span className="correction__label">{ui.correction}</span>
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
                <span className="article__illustrative">{ui.illustration}</span>
              ) : null}
              {article.heroImage.credit} &middot; {article.heroImage.license}
            </figcaption>
          </figure>
        )}

        <Prose blocks={article.body} locale={locale} sources={article.sources} />

        <References locale={locale} sources={article.sources} />

        {article.updateHistory.length === 0 ? null : (
          <section aria-labelledby="updates-heading" className="article__aside">
            <h2 id="updates-heading">{ui.updateHistory}</h2>
            <ul className="linked-list">
              {article.updateHistory.map((update) => (
                <li key={update.date}>
                  <time dateTime={update.date}>{formatDate(update.date, locale)}</time> —{" "}
                  {update.note}
                </li>
              ))}
            </ul>
          </section>
        )}

        {article.relatedLogisticID.length === 0 ? null : (
          <section aria-labelledby="services-heading" className="article__aside">
            <h2 id="services-heading">{ui.onTheMainSite}</h2>
            <ul className="linked-list">
              {article.relatedLogisticID
                .filter((entity) => !(entity.type === "page" && entity.path === "/request-a-quote"))
                .map((entity, index) => {
                  const target = relatedTarget(entity, locale);
                  return (
                    <li key={index}>
                      {/* A destination in another language says so, and carries
                          `hrefLang` so a crawler knows before following it. */}
                      <a
                        href={target.href}
                        {...(target.foreignLanguage ? { hrefLang: "en" } : {})}
                      >
                        {target.label}
                        {target.foreignLanguage ? FOREIGN_LANGUAGE_MARKER[locale] : ""}
                      </a>
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
                {ui.quotePrompt}{" "}
                {/* Resolved through `relatedTarget`, so the German article
                    links to the German quote page and the English one to the
                    English page, from a single mapping. */}
                <a
                  href={
                    relatedTarget({ type: "page", path: "/request-a-quote" }, locale).href
                  }
                >
                  {ui.quoteLinkText}
                </a>
                .
              </p>
            )}
          </section>
        )}

        {related.length === 0 ? null : (
          <section aria-labelledby="related-heading" className="article__aside">
            <h2 id="related-heading">{ui.relatedReading}</h2>
            <ul className="linked-list">
              {related.map((entry) => (
                <li key={entry.id}>
                  <Link href={articlePath(entry)}>{entry.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  );
}
