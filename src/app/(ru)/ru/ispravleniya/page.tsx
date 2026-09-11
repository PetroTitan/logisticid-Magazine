import Link from "next/link";

import { PolicyPage } from "@/components/policy-page";
import { publisher } from "@/config/publisher";
import { publicArticles } from "@/lib/corpus";
import { articlePath, staticAlternates, staticPath } from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { pageMetadata } from "@/lib/metadata";
import { mainSiteUrl } from "@/lib/site";

export const metadata = pageMetadata({
  path: staticPath("corrections", "ru"),
  locale: "ru",
  title: "Исправления",
  description:
    "Как LogisticID Magazine исправляет ошибки и перечень исправлений и содержательных обновлений.",
  languages: staticAlternates("corrections"),
});

/**
 * The Russian corrections record.
 *
 * It lists the RUSSIAN articles. An article's correction note is written in the
 * article's own language, so a Russian list carrying English notes would be a
 * page of English inside the Russian edition — and a Russian reader cannot act
 * on a correction they cannot read.
 */
export default function RussianCorrectionsPage() {
  const articles = publicArticles("ru");
  const corrected = articles.filter((article) => article.correctionNote !== undefined);
  const updated = articles.filter(
    (article) => article.correctionNote === undefined && article.updateHistory.length > 0,
  );

  return (
    <PolicyPage
      locale="ru"
      route="corrections"
      standfirst="Ошибки исправляются открыто — в самом материале и в списке ниже."
      title="Исправления"
    >
      <h2 id="how">Как происходят исправления</h2>
      <p>
        Если материал оказывается неверным в существенном пункте, он
        исправляется, к нему добавляется датированная пометка о том, что
        изменилось, и материал попадает в этот список. Исходное утверждение
        описывается в пометке, а не удаляется молча, чтобы тот, кто действовал
        по прежней версии, мог понять, касается ли это его.
      </p>
      <p>
        Опечатки и уточнения, не меняющие смысла, попадают в историю изменений
        материала, но не проводятся как исправления; называть их исправлениями
        значило бы засыпать те, которые действительно важны.
      </p>
      <p>
        Чтобы сообщить об ошибке, напишите на{" "}
        <a href={`mailto:${publisher.contactEmail}`}>{publisher.contactEmail}</a> или воспользуйтесь{" "}
        <a href={mainSiteUrl(mainSiteTarget("/contact", "ru").path).href}>
          контактной страницей LogisticID
        </a>
        .
      </p>

      <h2 id="record">Вынесенные исправления</h2>
      {corrected.length === 0 ? (
        <p>
          Исправлений не выносилось. Этот список формируется из самих
          материалов и поэтому не может с ними разойтись.
        </p>
      ) : (
        <ul>
          {corrected.map((article) => (
            <li key={article.id}>
              <Link href={articlePath(article)}>{article.title}</Link> — {article.correctionNote}
            </li>
          ))}
        </ul>
      )}

      <h2 id="updates">Содержательные обновления</h2>
      {updated.length === 0 ? (
        <p>Пока ни один материал содержательно не обновлялся.</p>
      ) : (
        <ul>
          {updated.map((article) => (
            <li key={article.id}>
              <Link href={articlePath(article)}>{article.title}</Link>
              <ul>
                {article.updateHistory.map((update) => (
                  <li key={update.date}>
                    <time dateTime={update.date}>{update.date}</time> — {update.note}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </PolicyPage>
  );
}
