import Link from "next/link";

import { getSection } from "@/content/sections";
import type { Article } from "@/content/types";

/**
 * One article in a listing.
 *
 * The heading is a real `h3` containing the only link, so the list is
 * navigable by heading in a screen reader and there is exactly one tab stop
 * per article rather than three overlapping ones.
 */
export function ArticleCard({ article }: { article: Article }) {
  const section = getSection(article.section);

  return (
    <li className="article-list__item">
      <p className="article-card__meta">
        {section === undefined ? null : (
          <span className="article-card__section">{section.name}</span>
        )}
        <time dateTime={article.datePublished}>{article.datePublished}</time>
        <span>{article.readingTime} min read</span>
      </p>
      <h3 className="article-card__title">
        <Link href={`/${article.section}/${article.slug}`}>{article.title}</Link>
      </h3>
      <p className="article-card__summary">{article.description}</p>
    </li>
  );
}
