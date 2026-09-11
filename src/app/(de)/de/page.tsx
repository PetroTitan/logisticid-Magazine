import { ArticleCard } from "@/components/article-card";
import { JsonLd } from "@/components/json-ld";
import { LanguageSwitcher } from "@/components/language-switcher";
import { strings } from "@/config/ui-strings";
import { sectionLabels, sections } from "@/content/sections";
import { articlesInSection, publicArticles } from "@/lib/corpus";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { indexPath, sectionPath } from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { magazineUrl, mainSiteUrl, site } from "@/lib/site";

const ui = strings("de");

export const metadata = pageMetadata({
  path: indexPath("de"),
  locale: "de",
  title: `${site.name} — Deutsch`,
  description: ui.standfirst,
  /*
   * The German index and the English index are the same page in two languages,
   * so the cluster is stated here rather than derived from the corpus: unlike
   * an article, an index has no `translationOf` edge to read. Both entries are
   * absolute URLs on the canonical host.
   */
  languages: {
    en: magazineUrl("/").href,
    de: magazineUrl(indexPath("de")).href,
    "x-default": magazineUrl("/").href,
  },
});

/**
 * The German Magazine index.
 *
 * It lists German articles only. An index that mixed languages would present
 * an English piece as German editorial output, and a reader following it would
 * change language without being told.
 *
 * Sections are listed only where they have something in German, for the same
 * reason the German header is short: a section link that lands on an English
 * index is a language change disguised as navigation.
 */
export default function GermanHomePage() {
  const articles = publicArticles("de");
  const [lead, ...rest] = articles;
  const populated = sections.filter(
    (section) => articlesInSection(section.slug, "de").length > 0,
  );

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl(mainSiteTarget("/", "de").path).href },
          { name: site.name, url: magazineUrl(indexPath("de")).href },
        ])}
      />

      <div className="shell page">
        <p className="page__eyebrow">LogisticID Magazine</p>
        <h1 className="page__title">{ui.homeTitle}</h1>
        <p className="page__standfirst">{ui.standfirst}</p>

        <LanguageSwitcher
          cluster={{ en: "/", de: indexPath("de") }}
          locale="de"
        />

        {lead === undefined ? (
          <p className="empty-state">{ui.emptyState}</p>
        ) : (
          <>
            <h2 className="sr-only">{ui.latestArticles}</h2>
            <ul className="article-list">
              <ArticleCard article={lead} />
              {rest.map((article) => (
                <ArticleCard article={article} key={article.id} />
              ))}
            </ul>
          </>
        )}

        {populated.length > 0 && (
          <section aria-labelledby="sections-heading" className="article__aside">
            <h2 id="sections-heading">{ui.sections}</h2>
            <ul className="section-grid">
              {populated.map((section) => (
                <li className="section-card" key={section.slug}>
                  <h3>
                    <Link href={sectionPath(section.slug, "de")}>{sectionLabels(section, "de").name}</Link>
                  </h3>
                  <p>{sectionLabels(section, "de").description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
