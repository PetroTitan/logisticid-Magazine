import { ArticleCard } from "@/components/article-card";
import { JsonLd } from "@/components/json-ld";
import { LanguageSwitcher } from "@/components/language-switcher";
import { strings } from "@/config/ui-strings";
import { sectionLabels, sections } from "@/content/sections";
import { articlesInSection, publicArticles } from "@/lib/corpus";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { indexPath, sectionPath, indexAlternates, indexCluster } from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { magazineUrl, mainSiteUrl, site } from "@/lib/site";

const ui = strings("ru");

export const metadata = pageMetadata({
  path: indexPath("ru"),
  locale: "ru",
  title: `${site.name} — на русском`,
  description: ui.standfirst,
  /*
   * The German index and the English index are the same page in two languages,
   * so the cluster is stated here rather than derived from the corpus: unlike
   * an article, an index has no `translationOf` edge to read. Both entries are
   * absolute URLs on the canonical host.
   */
  languages: indexAlternates(),
});

/**
 * The Russian Magazine index.
 *
 * It lists Russian articles only. An index that mixed languages would present
 * an English or German piece as Russian editorial output, and a reader
 * following it would change language without being told.
 *
 * Sections are listed only where they have something in Russian, for the same
 * reason the Russian header is short: a section link that lands on an English
 * index is a language change disguised as navigation.
 */
export default function RussianHomePage() {
  const articles = publicArticles("ru");
  const [lead, ...rest] = articles;
  const populated = sections.filter(
    (section) => articlesInSection(section.slug, "ru").length > 0,
  );

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl(mainSiteTarget("/", "ru").path).href },
          { name: site.name, url: magazineUrl(indexPath("ru")).href },
        ])}
      />

      <div className="shell page">
        <p className="page__eyebrow">LogisticID Magazine</p>
        <h1 className="page__title">{ui.homeTitle}</h1>
        <p className="page__standfirst">{ui.standfirst}</p>

        <LanguageSwitcher cluster={indexCluster()} locale="ru" />

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
                    <Link href={sectionPath(section.slug, "ru")}>
                      {sectionLabels(section, "ru").name}
                    </Link>
                  </h3>
                  <p>{sectionLabels(section, "ru").description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
