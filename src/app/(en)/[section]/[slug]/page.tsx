import { notFound } from "next/navigation";

import { ArticleView } from "@/components/article-view";
import { allPublicArticles, findArticle, publicArticles } from "@/lib/corpus";
import { articleAlternates, articlePath } from "@/lib/localized-routes";
import { pageMetadata } from "@/lib/metadata";

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
    openGraph: {
      type: "article",
      publishedTime: article.datePublished,
      ...(article.dateModified === undefined ? {} : { modifiedTime: article.dateModified }),
    },
    // Emitted only for an article with an explicit translation. An article
    // with none advertises no alternate rather than an aspirational one.
    ...(languages === undefined ? {} : { languages }),
  });
}

export default async function ArticlePage({ params }: Params) {
  const { section, slug } = await params;
  const article = findArticle(section, slug);
  if (article === undefined) notFound();
  return <ArticleView article={article} locale="en" />;
}
