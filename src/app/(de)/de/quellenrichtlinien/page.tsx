import { PolicyPage } from "@/components/policy-page";
import { staticAlternates, staticPath } from "@/lib/localized-routes";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  path: staticPath("sourcing-policy", "de"),
  locale: "de",
  title: "Quellenrichtlinien",
  description:
    "Die Quellenhierarchie, nach der LogisticID Magazine arbeitet, wie Belege erfasst werden und was hier nicht als Beleg gilt.",
  languages: staticAlternates("sourcing-policy"),
});

export default function GermanSourcingPolicyPage() {
  return (
    <PolicyPage
      locale="de"
      route="sourcing-policy"
      standfirst="Jede wesentliche sachliche Aussage in LogisticID Magazine ist an eine Quelle gebunden, die sich öffnen und prüfen lässt. Diese Seite beschreibt, welche Quellen zählen und wie sie erfasst werden."
      title="Quellenrichtlinien"
    >
      <h2 id="hierarchy">Die Quellenhierarchie</h2>
      <p>Wesentliche sachliche Aussagen werden aus der jeweils höchsten verfügbaren Stufe belegt:</p>
      <ol>
        <li>EU-Institutionen und EUR-Lex für europäisches Recht;</li>
        <li>nationale Verkehrs-, Zoll- und sonstige Behörden;</li>
        <li>UNECE und andere zwischenstaatliche Einrichtungen;</li>
        <li>Eurostat und nationale Statistikämter;</li>
        <li>anerkannte Forschungseinrichtungen und begutachtete Fachliteratur;</li>
        <li>Normungsorganisationen, soweit das Material öffentlich zugänglich ist;</li>
        <li>die IRU und vergleichbare Brancheninstitutionen;</li>
        <li>offizielle Infrastruktur- und Betreiberdokumentation;</li>
        <li>Mitteilungen eines Unternehmens über sich selbst;</li>
        <li>technische Herstellerunterlagen für Angaben zum Equipment.</li>
      </ol>
      <p>
        Die Fachpresse kann auf eine Entwicklung hinweisen, wird hier aber genutzt, um die
        Primärquelle zu finden, und nicht, um sie zu ersetzen.
      </p>

      <h2 id="not-evidence">Was hier nicht als Beleg gilt</h2>
      <p>
        Sachliche Beiträge stützen sich nicht auf SEO-Blogs, Affiliate-Seiten, anonyme
        Transportblogs, ausgelesene Zusammenfassungen, Content-Aggregatoren oder KI-erzeugte
        Zusammenfassungen. Diese geben zuverlässig die Fehler der jeweils anderen wieder, und eine
        Aussage, die in zwanzig von ihnen steht, ist damit nicht zwanzigmal bestätigt.
      </p>

      <h2 id="paywalled">Quellen, die nicht vollständig gelesen werden konnten</h2>
      <p>
        Manche Normen und Berichte sind kostenpflichtig oder anderweitig nicht zugänglich. Wo nur
        ein Abstract, eine Zusammenfassung oder ein Inhaltsverzeichnis verfügbar war, sagt der
        Quellennachweis das ausdrücklich, und der Beitrag stellt den Volltext nicht als gelesen dar.
        Zu behaupten, eine Norm gelesen zu haben, die nie geöffnet wurde, ist die stille Form der
        Erfindung, die für Leserinnen und Leser am schwersten zu erkennen ist.
      </p>

      <h2 id="citations">Wie Belege hier funktionieren</h2>
      <p>
        Belege sind im Text nummeriert und führen auf ein Quellenverzeichnis, das in der Seite
        selbst steht und nicht nachgeladen wird. Jeder Eintrag nennt die verantwortliche Person
        oder Organisation, den Titel, das Publikationsorgan, das Datum, eine Kennung, soweit es
        eine gibt, und das Datum, an dem die Quelle tatsächlich eingesehen wurde.
      </p>
      <p>
        Abrufdaten werden von einem Menschen erfasst, der die Quelle öffnet. Sie werden nie vom
        Build erzeugt und nie der Bequemlichkeit halber auf das Veröffentlichungsdatum gesetzt —
        ein erfundenes Abrufdatum ist eine falsche Aussage über redaktionelle Arbeit, die nicht
        stattgefunden hat.
      </p>
      <p>
        Der Build erzwingt beide Richtungen: Ein Beitrag, der eine nicht aufgeführte Quelle zitiert,
        erscheint nicht, und ein Beitrag, der eine Quelle aufführt, die er nie zitiert, ebenso
        wenig. Die zweite Regel wiegt so schwer wie die erste, denn ein Verzeichnis ungenutzter
        Autoritäten borgt sich deren Glaubwürdigkeit, ohne die Arbeit zu leisten.
      </p>

      <h2 id="time-sensitive">Zeitkritisches Material</h2>
      <p>
        Rechtliche, aufsichtsrechtliche, marktbezogene und tagesaktuelle Aussagen ändern sich.
        Beiträge, die sie behandeln, nennen die Rechtsordnung und das Datum, zu dem der Stand
        geprüft wurde, und werden erneut geprüft, statt stillschweigend stehen zu bleiben. Wo sich
        ein Stand seit der Prüfung verschoben haben kann, fordert der Beitrag zur Prüfung auf,
        statt zu unterstellen, er gelte weiter.
      </p>
    </PolicyPage>
  );
}
