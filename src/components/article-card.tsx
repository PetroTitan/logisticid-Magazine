import Link from "next/link";
import { articlePath } from "@/lib/localized-routes";

import { strings } from "@/config/ui-strings";
import { getSection, sectionLabels } from "@/content/sections";
import type { Article } from "@/content/types";

/**
 * One article in a listing.
 *
 * The heading is a real `h3` containing the only link, so the list is
 * navigable by heading in a screen reader and there is exactly one tab stop
 * per article rather than three overlapping ones.
 *
 * EVERY LABEL COMES FROM THE ARTICLE'S OWN LOCALE, not from a prop. A card
 * describes one article, that article has a language, and taking the language
 * from the thing being described makes "min read" under a German headline
 * unreachable rather than merely unlikely. The listings are single-language by
 * construction, so this is also always the language of the page.
 */
export function ArticleCard({ article }: { article: Article }) {
  const section = getSection(article.section);
  const ui = strings(article.locale);

  return (
    <li className="article-list__item">
      <p className="article-card__meta">
        {section === undefined ? null : (
          <span className="article-card__section">
            {sectionLabels(section, article.locale).name}
          </span>
        )}
        {/* The ISO date, deliberately unformatted and therefore unchanged in
            both languages: it is the one piece of card furniture that is
            already language-neutral, and reformatting it per locale would
            alter every English card for no reader's benefit. */}
        <time dateTime={article.datePublished}>{article.datePublished}</time>
        <span>
          {article.readingTime} {ui.minuteRead}
        </span>
      </p>
      <h3 className="article-card__title">
        <Link href={articlePath(article)}>{article.title}</Link>
      </h3>
      <p className="article-card__summary">{article.description}</p>
    </li>
  );
}
