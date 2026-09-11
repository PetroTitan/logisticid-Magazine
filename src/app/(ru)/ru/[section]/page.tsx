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
  sectionPath,
} from "@/lib/localized-routes";
import { defaultLocale, locales, type Locale } from "@/config/locales";

/** The translated locales that publish an index for this section. */
function translatedIndexes(section: string): readonly Locale[] {
  return locales.filter(
    (locale) => locale !== defaultLocale && articlesInSection(section, locale).length > 0,
  );
}
import { mainSiteTarget } from "@/lib/main-site-links";
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl } from "@/lib/site";

type Params = { params: Promise<{ section: string }> };

/**
 * Only sections that actually hold a Russian article are generated.
 *
 * A Russian section index listing nothing would be a thin indexable page in a
 * language the publication barely publishes in, and it would appear in the
 * sitemap and in an hreflang cluster claiming to be the Russian equivalent of a
 * populated English section. With `dynamicParams = false`, any other Russian
 * section path is a real 404.
 */
export function generateStaticParams() {
  return sections
    .filter((section) => articlesInSection(section.slug, "ru").length > 0)
    .map((section) => ({ section: section.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params) {
  const { section: slug } = await params;
  const section = getSection(slug);
  if (section === undefined) return {};

  return pageMetadata({
    path: sectionPath(section.slug, "ru"),
    locale: "ru",
    title: sectionLabels(section, "ru").name,
    description: sectionLabels(section, "ru").description,
    // Only the languages whose index for this section exists. Derived by the
    // same rule `generateStaticParams` applies, so the two cannot disagree.
    ...(() => {
      const languages = sectionAlternates(section.slug, translatedIndexes(section.slug));
      return languages === undefined ? {} : { languages };
    })(),
  });
}

export default async function RussianSectionPage({ params }: Params) {
  const { section: slug } = await params;
  const section = getSection(slug);
  if (section === undefined) notFound();

  const articles = articlesInSection(section.slug, "ru");
  const locale = "ru" as const;
  const ui = strings(locale);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl(mainSiteTarget("/", locale).path).href },
          /*
           * The SAME string the visible breadcrumb shows. Structured data that
           * names a step differently from the trail on the page describes a
           * hierarchy the reader cannot see, and the guidance for
           * `BreadcrumbList` is explicit that the name should be the visible
           * one. It was `site.name` — "LogisticID Magazine" — under a visible
           * crumb reading "Magazine", and under a Russian one reading "Magazin".
           */
          { name: ui.magazineCrumb, url: magazineUrl(indexPath("ru")).href },
          { name: sectionLabels(section, "ru").name, url: magazineUrl(sectionPath(section.slug, "ru")).href },
        ])}
      />

      <div className="shell page">
        <Breadcrumbs
          locale={locale}
          crumbs={[
            // The trail climbs to the main site IN THE READER'S LANGUAGE. A
            // Russian page whose breadcrumb root is the English home describes a
            // hierarchy that changes language halfway up.
            { label: "LogisticID", href: mainSiteUrl(mainSiteTarget("/", locale).path).href },
            { label: ui.magazineCrumb, href: indexPath("ru") },
            { label: sectionLabels(section, "ru").name },
          ]}
        />
        <p className="page__eyebrow">{ui.sectionEyebrow}</p>
        <h1 className="page__title">{sectionLabels(section, "ru").name}</h1>
        <p className="page__standfirst">{sectionLabels(section, "ru").intro}</p>

        <LanguageSwitcher
          cluster={sectionClusterFor(section.slug, translatedIndexes(section.slug))}
          locale="ru"
        />

        {articles.length === 0 ? (
          <p className="empty-state">{ui.emptySection}</p>
        ) : (
          <>
            <h2 className="sr-only">{ui.latestArticles}</h2>
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
