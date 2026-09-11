import Link from "next/link";

import { PolicyPage } from "@/components/policy-page";
import { publisher } from "@/config/publisher";
import { publicArticles } from "@/lib/corpus";
import { articlePath, staticAlternates, staticPath } from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { pageMetadata } from "@/lib/metadata";
import { mainSiteUrl } from "@/lib/site";

export const metadata = pageMetadata({
  path: staticPath("corrections", "de"),
  locale: "de",
  title: "Korrekturen",
  description:
    "Wie LogisticID Magazine Fehler korrigiert und das Verzeichnis der Korrekturen und inhaltlichen Aktualisierungen.",
  languages: staticAlternates("corrections"),
});

/**
 * The German corrections record.
 *
 * It lists the GERMAN articles. An article's correction note is written in the
 * article's own language, so a German list carrying English notes would be a
 * page of English inside the German edition — and a German reader cannot act
 * on a correction they cannot read. The English page lists the English ones
 * for the same reason.
 */
export default function GermanCorrectionsPage() {
  const articles = publicArticles("de");
  const corrected = articles.filter((article) => article.correctionNote !== undefined);
  const updated = articles.filter(
    (article) => article.correctionNote === undefined && article.updateHistory.length > 0,
  );

  return (
    <PolicyPage
      locale="de"
      route="corrections"
      standfirst="Fehler werden offen korrigiert — am Beitrag selbst und in der Liste unten."
      title="Korrekturen"
    >
      <h2 id="how">Wie Korrekturen ablaufen</h2>
      <p>
        Stellt sich ein Beitrag in einem wesentlichen Punkt als falsch heraus, wird er korrigiert,
        ein datierter Hinweis auf die Änderung wird angefügt, und der Beitrag wird hier aufgeführt.
        Die ursprüngliche Aussage wird im Hinweis beschrieben und nicht stillschweigend gelöscht,
        damit wer nach der früheren Fassung gehandelt hat erkennen kann, ob es ihn betrifft.
      </p>
      <p>
        Tippfehler und Klarstellungen, die den Sinn nicht ändern, stehen im Änderungsverlauf eines
        Beitrags, werden aber nicht als Korrektur geführt; sie so zu nennen würde die Korrekturen
        verschütten, auf die es ankommt.
      </p>
      <p>
        Um einen Fehler zu melden, schreiben Sie an{" "}
        <a href={`mailto:${publisher.contactEmail}`}>{publisher.contactEmail}</a> oder nutzen Sie
        die{" "}
        <a href={mainSiteUrl(mainSiteTarget("/contact", "de").path).href}>
          Kontaktseite von LogisticID
        </a>
        .
      </p>

      <h2 id="record">Ergangene Korrekturen</h2>
      {corrected.length === 0 ? (
        <p>
          Es wurden keine Korrekturen ausgesprochen. Diese Liste wird aus den Beiträgen selbst
          erzeugt und kann deshalb nicht von ihnen abweichen.
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

      <h2 id="updates">Inhaltliche Aktualisierungen</h2>
      {updated.length === 0 ? (
        <p>Bislang wurde kein Beitrag inhaltlich aktualisiert.</p>
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
