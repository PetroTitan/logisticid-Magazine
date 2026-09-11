import { notFound } from "next/navigation";

import { ArticleView } from "@/components/article-view";
import { allPublicArticles, findArticle, publicArticles } from "@/lib/corpus";
import { articleAlternates, articlePath } from "@/lib/localized-routes";
import { pageMetadata } from "@/lib/metadata";
import { sharedImageUrl } from "@/lib/site";

type Params = { params: Promise<{ section: string; slug: string }> };

/**
 * German articles.
 *
 * A thin wrapper over the same `ArticleView` the English route renders. Only
 * the locale differs, so a fix to the article layout lands in both languages
 * at once.
 *
 * `publicArticles("de")` means the params are German articles ONLY. Combined
 * with `dynamicParams = false`, an English slug under `/de/` is a real 404
 * rather than an English article served from a German URL with a 200 — which
 * is the duplicate-content failure the whole route split exists to prevent.
 */
export function generateStaticParams() {
  return publicArticles("de").map((article) => ({
    section: article.section,
    slug: article.slug,
  }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params) {
  const { section, slug } = await params;
  const article = findArticle(section, slug, "de");
  if (article === undefined) return {};

  const languages = articleAlternates(article, allPublicArticles());

  return pageMetadata({
    path: articlePath(article),
    locale: article.locale,
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.description,
    ...(article.socialTitle === undefined ? {} : { socialTitle: article.socialTitle }),
    ...(article.socialDescription === undefined
      ? {}
      : { socialDescription: article.socialDescription }),
    ...(article.heroImage === undefined
      ? {}
      : {
          image: {
            url: sharedImageUrl(article.heroImage.src).href,
            width: article.heroImage.width,
            height: article.heroImage.height,
            alt: article.heroImage.alt,
          },
        }),
    openGraph: {
      type: "article",
      publishedTime: article.datePublished,
      ...(article.dateModified === undefined ? {} : { modifiedTime: article.dateModified }),
    },
    ...(languages === undefined ? {} : { languages }),
  });
}

export default async function GermanArticlePage({ params }: Params) {
  const { section, slug } = await params;
  const article = findArticle(section, slug, "de");
  if (article === undefined) notFound();
  return <ArticleView article={article} locale="de" />;
}
