import Link from "next/link";

import { ArticleCard } from "@/components/article-card";
import { JsonLd } from "@/components/json-ld";
import { LanguageSwitcher } from "@/components/language-switcher";
import { strings } from "@/config/ui-strings";
import { sectionLabels, sections } from "@/content/sections";
import { publicArticles } from "@/lib/corpus";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { indexAlternates, indexCluster } from "@/lib/localized-routes";
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl, site } from "@/lib/site";

const ui = strings("en");

export const metadata = pageMetadata({
  path: "/",
  title: site.name,
  description: site.tagline,
  /*
   * The English and German indexes are the same page in two languages. Stated
   * here rather than derived, because an index has no `translationOf` edge to
   * read — and stated on BOTH sides, because a one-sided alternate is a
   * cluster a search engine will not act on. The German index has carried its
   * half since Phase 4S-A; this is the other half.
   */
  languages: indexAlternates(),
});

export default function HomePage() {
  const articles = publicArticles();
  // Ordering is by publication date, which is a fact. Nothing here is sorted
  // by popularity, "trending" or a recommendation score: none of those is
  // measured, and presenting an arbitrary order as one of them would be a
  // claim about readership the publication cannot support.
  const [lead, ...rest] = articles;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl("/").href },
          { name: site.name, url: magazineUrl("/").href },
        ])}
      />

      <div className="shell page">
        <p className="page__eyebrow">LogisticID Magazine</p>
        <h1 className="page__title">{ui.homeTitle}</h1>
        <p className="page__standfirst">{ui.standfirst}</p>

        {/* The other half of the pair the German index has offered since
            4S-A. A switcher on one side only is a door that opens one way. */}
        <LanguageSwitcher cluster={indexCluster()} locale="en" />

        {lead === undefined ? (
          <p className="empty-state">{ui.emptyState}</p>
        ) : (
          <>
            {/* Structures the page for a screen reader without repeating a
                heading the visual hierarchy already makes obvious. */}
            <h2 className="sr-only">{ui.latestArticles}</h2>
            <ul className="article-list">
              <ArticleCard article={lead} />
              {rest.map((article) => (
                <ArticleCard article={article} key={article.id} />
              ))}
            </ul>
          </>
        )}

        <section aria-labelledby="sections-heading" className="article__aside">
          <h2 id="sections-heading">{ui.sections}</h2>
          <ul className="section-grid">
            {sections.map((section) => (
              <li className="section-card" key={section.slug}>
                <h3>
                  <Link href={`/${section.slug}`}>{sectionLabels(section, "en").name}</Link>
                </h3>
                <p>{sectionLabels(section, "en").description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
