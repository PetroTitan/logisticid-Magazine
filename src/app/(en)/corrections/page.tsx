import Link from "next/link";

import { PolicyPage } from "@/components/policy-page";
import { publisher } from "@/config/publisher";
import { publicArticles } from "@/lib/corpus";
import { articlePath, staticAlternates } from "@/lib/localized-routes";
import { pageMetadata } from "@/lib/metadata";
import { mainSiteUrl } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/corrections",
  title: "Corrections",
  description:
    "How LogisticID Magazine corrects mistakes, and the record of corrections and substantive updates it has made.",
  languages: staticAlternates("corrections"),
});

export default function CorrectionsPage() {
  const articles = publicArticles();
  const corrected = articles.filter((article) => article.correctionNote !== undefined);
  const updated = articles.filter(
    (article) => article.correctionNote === undefined && article.updateHistory.length > 0,
  );

  return (
    <PolicyPage
      route="corrections"
      standfirst="Mistakes are corrected in the open, on the article itself and in the list below."
      title="Corrections"
    >
      <h2 id="how">How corrections work</h2>
      <p>
        When an article is found to be wrong on a material point, the article is corrected, a dated
        note explaining what changed is added to it, and it is listed here. The original claim is
        described in the note rather than quietly deleted, so a reader who acted on the earlier
        version can tell whether it affected them.
      </p>
      <p>
        Typographical fixes and clarifications that do not change meaning are recorded in an
        article&rsquo;s update history but are not listed as corrections; calling them corrections
        would bury the ones that matter.
      </p>
      <p>
        To report an error, write to{" "}
        <a href={`mailto:${publisher.contactEmail}`}>{publisher.contactEmail}</a>, or use the{" "}
        <a href={mainSiteUrl("/contact").href}>LogisticID contact page</a>.
      </p>

      <h2 id="record">Corrections issued</h2>
      {corrected.length === 0 ? (
        <p>
          No corrections have been issued. This list is generated from the articles themselves, so
          it cannot fall out of step with them.
        </p>
      ) : (
        <ul>
          {corrected.map((article) => (
            <li key={article.id}>
              <Link href={articlePath(article)}>{article.title}</Link> —{" "}
              {article.correctionNote}
            </li>
          ))}
        </ul>
      )}

      <h2 id="updates">Substantive updates</h2>
      {updated.length === 0 ? (
        <p>No articles have been substantively updated yet.</p>
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
