import Link from "next/link";

import { PolicyPage } from "@/components/policy-page";
import { publisher } from "@/config/publisher";
import { staticAlternates, staticPath } from "@/lib/localized-routes";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  path: staticPath("editorial-policy", "de"),
  locale: "de",
  title: "Redaktionsrichtlinien",
  description:
    "Was LogisticID Magazine veröffentlicht, was es nicht veröffentlicht und wo seine Hinweise enden und fachliche Beratung beginnt.",
  languages: staticAlternates("editorial-policy"),
});

export default function GermanEditorialPolicyPage() {
  return (
    <PolicyPage
      locale="de"
      route="editorial-policy"
      standfirst="LogisticID Magazine erklärt, wie europäischer Straßengüterverkehr funktioniert. Herausgegeben wird es von LogisticID, einer Spedition — und diese Seite legt dar, was das für das bedeutet, was Sie hier lesen."
      title="Redaktionsrichtlinien"
    >
      <h2 id="what-this-is">Was diese Publikation ist</h2>
      <p>
        LogisticID Magazine ist informierend und erklärend. Es beschreibt Ladungsarten, Equipment,
        Planung, Dokumente und den rechtlichen Rahmen des europäischen Straßengüterverkehrs, damit
        wer eine Sendung organisiert die anstehenden Entscheidungen versteht.
      </p>
      <p>
        Es ist allgemeine Information darüber, wie Transporte funktionieren. Es ist keine Beurteilung
        Ihrer Sendung.
      </p>

      <h2 id="boundary">Wo das hier endet</h2>
      <p>Nichts, was hier erscheint, ersetzt:</p>
      <ul>
        <li>die Beurteilung einer konkreten Sendung durch eine Spedition;</li>
        <li>
          die Entscheidung eines Transportunternehmens, eine Ladung anzunehmen oder abzulehnen;
        </li>
        <li>einen Zollvertreter oder die zuständige Zollbehörde;</li>
        <li>Rechts-, Steuer-, Sanktions- oder Versicherungsberatung;</li>
        <li>einen Gefahrgutbeauftragten;</li>
        <li>
          die Stelle, die über eine Erlaubnis, eine Genehmigung oder eine Anordnung entscheidet;
        </li>
        <li>die Prüfung des Vertrags, den Sie tatsächlich unterschreiben.</li>
      </ul>
      <p>
        Wo ein Ergebnis von Strecke, Ware, Equipment, Vertrag, Rechtsordnung, Datum oder der
        Annahme durch ein Transportunternehmen abhängt, sagen die Beiträge das, statt ein Ergebnis
        zu nennen. Deshalb ist die Sprache in rechtlichen und operativen Beiträgen vorsichtig: Auf
        viele Fragen im Transport lautet die ehrliche Antwort, dass es darauf ankommt — und etwas
        anderes zu schreiben wäre nur dann nützlicher, wenn es zuträfe.
      </p>

      <h2 id="ownership">Wer das herausgibt und welches Interesse dahintersteht</h2>
      <p>
        LogisticID organisiert europäischen Straßengüterverkehr über selbstständige
        Transportunternehmen. Das Unternehmen hat ein wirtschaftliches Interesse daran, dass
        Leserinnen und Leser Transporte gut genug verstehen, um mit einer Spedition zu arbeiten. Es
        ist keine neutrale Partei.
      </p>
      <p>
        Dieses Interesse wird offengelegt und nicht weggeredet. Die Beiträge bewerten keine
        Transportunternehmen in einer Rangfolge, stellen LogisticID nicht vorteilhaft neben
        namentlich genannte Wettbewerber und enthalten weder Werbung noch Affiliate-Links noch
        bezahlte Platzierungen. Links auf LogisticID-Leistungsseiten sind als solche gekennzeichnet
        und stehen nach dem Beitrag, nicht in seiner Argumentation.
      </p>

      <h2 id="imprint">Das Unternehmen hinter dem Magazin</h2>
      <p>
        LogisticID Magazine wird herausgegeben von {publisher.legalName}, Identifikationsnummer
        (IČO) {publisher.registrationNumber}, eingetragen im {publisher.registry} unter dem
        Aktenzeichen {publisher.registryFileNumber}, mit eingetragenem Sitz in{" "}
        {publisher.registeredOffice}. Post zum Magazin erreicht das Unternehmen unter{" "}
        <a href={`mailto:${publisher.contactEmail}`}>{publisher.contactEmail}</a>.
      </p>
      <p>
        Diese Anschrift ist der eingetragene Sitz des Unternehmens: die Adresse, unter der ihm
        Schriftstücke zugestellt werden können. Sie ist keine Redaktion, kein Lager, kein Terminal
        und kein Depot, und es gibt dort nichts, was Leserinnen, Leser oder Kunden besuchen
        könnten. LogisticID organisiert Transporte, die selbstständige Transportunternehmen
        durchführen, und betreibt selbst keine Anlagen.
      </p>

      <h2 id="never">Was hier nie erscheint</h2>
      <p>
        Das Magazin erfindet keine Angaben, um eine Seite zu füllen. Es veröffentlicht keinen
        Frachtpreis, keinen Dieselzuschlag, keine Laufzeit, keine Verfügbarkeit, keine zoll- oder
        aufsichtsrechtliche Anforderung, keine sanktionsrechtliche Bewertung, keine Entscheidung
        über die Eignung eines Transportunternehmens, keine Entscheidung über die Annahme einer
        Ladung, kein Angebot, keinen Bericht, keinen Datensatz, keine Norm, keine Quellenangabe,
        keine Unfallstatistik, keinen Emissionswert und keine Einsparungsbehauptung, die nicht
        gegen eine echte Quelle geprüft wurde.
      </p>
      <p>
        Ebenso wenig erscheinen Ranglisten nach „beliebtesten“, „meistgelesenen“, „besten“,
        „günstigsten“ oder „schnellsten“ Einträgen. Dafür braucht es eigene Daten und eine
        offengelegte Methodik; ohne beides sind sie Dekoration, die sich wie ein Beleg liest.
      </p>
      <p>
        Wo eine Angabe nicht vorliegt und nicht geprüft ist, steht auf der Seite nichts, statt dass
        geschätzt wird. Ein leerer Abschnitt ist ehrlicher als ein gefüllter, der falsch ist.
      </p>

      <h2 id="dates">Daten und Aktualität</h2>
      <p>
        Jeder Beitrag trägt ein Veröffentlichungsdatum und, sobald er geändert wurde, ein
        Änderungsdatum. Beiträge, die einen rechtlichen oder marktbezogenen Stand beschreiben,
        nennen zusätzlich das Datum, zu dem dieser Stand geprüft wurde, und die Rechtsordnung, für
        die er gilt — denn eine Regel ohne Datum und ohne Ort ist keine Regel, auf die man sich
        stützen kann.
      </p>

      <h2 id="related">Verwandte Seiten</h2>
      <ul>
        <li>
          <Link href={staticPath("sourcing-policy", "de")}>Wie Beiträge belegt werden</Link>
        </li>
        <li>
          <Link href={staticPath("image-policy", "de")}>Bilder und KI</Link>
        </li>
        <li>
          <Link href={staticPath("corrections", "de")}>Korrekturen</Link>
        </li>
      </ul>
    </PolicyPage>
  );
}
