import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/article-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { LanguageSwitcher } from "@/components/language-switcher";
import { strings } from "@/config/ui-strings";
import { getSection, sectionLabels, sections } from "@/content/sections";
import { articlesInSection } from "@/lib/corpus";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import {
  indexPath,
  sectionAlternates,
  sectionClusterFor,
} from "@/lib/localized-routes";
import { defaultLocale, locales, type Locale } from "@/config/locales";

/**
 * The translated locales that actually publish an index for this section.
 *
 * Derived, not listed. The same rule each translated section route applies in
 * `generateStaticParams`, so the alternate, the switcher and the generated
 * page cannot disagree about what exists.
 */
function translatedIndexes(section: string): readonly Locale[] {
  return locales.filter(
    (locale) => locale !== defaultLocale && articlesInSection(section, locale).length > 0,
  );
}
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl } from "@/lib/site";

type Params = { params: Promise<{ section: string }> };

const ui = strings("en");

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
    title: sectionLabels(section, "en").name,
    description: sectionLabels(section, "en").description,
    /*
     * Only the languages whose index for THIS section actually exists. A
     * translated section route generates a param only for a section that holds
     * an article in that language, so advertising the alternate
     * unconditionally would point a crawler at a 404 — the reason the main
     * site's manifest models a missing translation as a missing value rather
     * than a derivable path.
     */
    ...(() => {
      const languages = sectionAlternates(section.slug, translatedIndexes(section.slug));
      return languages === undefined ? {} : { languages };
    })(),
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
          /*
           * The SAME string the visible breadcrumb shows. Structured data that
           * names a step differently from the trail on the page describes a
           * hierarchy the reader cannot see, and the guidance for
           * `BreadcrumbList` is explicit that the name should be the visible
           * one. It was `site.name` — "LogisticID Magazine" — under a visible
           * crumb reading "Magazine", and under a German one reading "Magazin".
           */
          { name: ui.magazineCrumb, url: magazineUrl("/").href },
          { name: sectionLabels(section, "en").name, url: magazineUrl(`/${section.slug}`).href },
        ])}
      />

      <div className="shell page">
        <Breadcrumbs
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl("/").href },
            { label: ui.magazineCrumb, href: indexPath("en") },
            { label: sectionLabels(section, "en").name },
          ]}
        />
        <p className="page__eyebrow">{ui.sectionEyebrow}</p>
        <h1 className="page__title">{sectionLabels(section, "en").name}</h1>
        <p className="page__standfirst">{sectionLabels(section, "en").intro}</p>

        {/* Offered only where the German index exists — the switcher takes
            the same cluster the head advertises, so the control and the
            `hreflang` cannot disagree about what is there. */}
        <LanguageSwitcher
          cluster={sectionClusterFor(section.slug, translatedIndexes(section.slug))}
          locale="en"
        />

        {articles.length === 0 ? (
          <p className="empty-state">{ui.emptySection}</p>
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
