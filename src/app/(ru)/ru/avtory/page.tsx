import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { LanguageSwitcher } from "@/components/language-switcher";
import { strings } from "@/config/ui-strings";
import { authorLabels, authors } from "@/content/authors";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import {
  authorPath,
  indexPath,
  magazineStaticRoutes,
  staticAlternates,
  staticPath,
} from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { pageMetadata } from "@/lib/metadata";
import { magazineUrl, mainSiteUrl } from "@/lib/site";

const ui = strings("ru");

export const metadata = pageMetadata({
  path: staticPath("authors", "ru"),
  locale: "ru",
  title: "Авторы",
  description: "Кто пишет LogisticID Magazine и как подписываются материалы.",
  languages: staticAlternates("authors"),
});

export default function RussianAuthorsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl(mainSiteTarget("/", "ru").path).href },
          /*
           * The SAME string the visible breadcrumb shows. Structured data that
           * names a step differently from the trail on the page describes a
           * hierarchy the reader cannot see, and the guidance for
           * `BreadcrumbList` is explicit that the name should be the visible
           * one. It was `site.name` — "LogisticID Magazine" — under a visible
           * crumb reading "Magazine", and under a German one reading "Magazin".
           */
          { name: ui.magazineCrumb, url: magazineUrl(indexPath("ru")).href },
          { name: ui.authors, url: magazineUrl(staticPath("authors", "ru")).href },
        ])}
      />

      <div className="shell page">
        <Breadcrumbs
          locale="ru"
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl(mainSiteTarget("/", "ru").path).href },
            { label: ui.magazineCrumb, href: indexPath("ru") },
            { label: ui.authors },
          ]}
        />
        <h1 className="page__title">{ui.authors}</h1>
        <p className="page__standfirst">
          LogisticID пока не публикует профили отдельных сотрудников. Поэтому
          материалы подписаны редакцией как организацией, а не конкретным
          человеком. Приписать их выдуманному человеку значило бы поставить
          фиктивную компетентность за указаниями о перевозках, таможне и
          соблюдении требований. Именные подписи появятся здесь, как только
          будут опубликованы реальные коллеги.
        </p>

        <LanguageSwitcher cluster={magazineStaticRoutes.authors} locale="ru" />

        <ul className="section-grid">
          {authors.map((author) => (
            <li className="section-card" key={author.slug}>
              <h2>
                <Link href={authorPath(author.slug, "ru")}>
                  {authorLabels(author, "ru").name}
                </Link>
              </h2>
              <p>{authorLabels(author, "ru").role}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
