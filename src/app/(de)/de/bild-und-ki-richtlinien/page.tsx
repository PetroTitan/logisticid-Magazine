import Link from "next/link";

import { PolicyPage } from "@/components/policy-page";
import { staticAlternates, staticPath } from "@/lib/localized-routes";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  path: staticPath("image-policy", "de"),
  locale: "de",
  title: "Bild- und KI-Richtlinien",
  description:
    "Woher LogisticID Magazine seine Bilder bezieht, welche Herkunftsangaben erfasst werden und wie KI bei der Erstellung von Beiträgen eingesetzt wird und wie nicht.",
  languages: staticAlternates("image-policy"),
});

export default function GermanImagePolicyPage() {
  return (
    <PolicyPage
      locale="de"
      route="image-policy"
      standfirst="Was neben einem Beitrag steht, ist ebenfalls eine Aussage. Diese Seite legt dar, woher die Bilder stammen und wie KI eingesetzt wird."
      title="Bild- und KI-Richtlinien"
    >
      <h2 id="provenance">Herkunft der Bilder</h2>
      <p>
        Ein Bild erscheint nur, wenn sich seine Rechte benennen lassen. Zu jedem Bild erfasst das
        Magazin die Quelle, die Urheberin oder den Urheber, die Lizenz, einen Link auf das Original,
        soweit es einen gibt, die Bildunterschrift mit Nachweis, einen beschreibenden Alternativtext
        und die tatsächlichen Abmessungen. Diese Felder sind Pflicht: Ein Beitrag, dessen Bild eines
        davon fehlt, wird nicht gebaut.
      </p>
      <p>
        Die Abmessungen sind aus einem zweiten Grund Pflicht. Ohne sie kann der Browser vor dem
        Laden keinen Platz reservieren, und der Text, in dem gerade gelesen wird, verrutscht darunter.
      </p>

      <h2 id="not-used">Was nicht verwendet wird</h2>
      <p>
        Keine Bilder von Pinterest, aus Bildaggregatoren, aus Suchergebnissen oder aus Quellen,
        deren Rechte sich nicht klären lassen. „Weit verbreitet“ ist keine Lizenz.
      </p>

      <h2 id="illustration">Illustration und Beleg</h2>
      <p>
        Diagramme und Illustrationen sind überall, wo sie erscheinen, als Illustration
        gekennzeichnet. Ein erzeugtes oder gezeichnetes Bild wird nie als Fotografie des
        beschriebenen Gegenstands ausgegeben, und ein Bild dient nie als Beleg für eine Aussage,
        die der Text nicht mit einer Quelle stützt.
      </p>
      <p>
        Das Magazin ist so angelegt, dass es auch ohne Fotografie fertig aussieht. Wo es kein Bild
        mit sauberer Herkunft gibt, erscheint ein Beitrag ohne Bild statt mit einem Stockfoto von
        einem Lkw, das Leserinnen und Lesern nichts zeigt.
      </p>

      <h2 id="ai">Wie KI eingesetzt wird</h2>
      <p>
        KI-Werkzeuge können beim Entwurf, bei der Gliederung und beim Redigieren helfen. Sie werden
        nicht eingesetzt, um Tatsachen, Quellen, Belege, Zitate, Statistiken oder rechtliche Stände
        zu erzeugen, und nichts erscheint, ohne dass ein Mensch jede wesentliche Aussage gegen die
        dafür angeführte Quelle geprüft hat.
      </p>
      <p>
        Das ist gerade hier von Bedeutung. Ein Sprachmodell, das nach einem Zollverfahren oder einer
        Verkehrsvorschrift gefragt wird, liefert eine flüssige, plausible, korrekt formatierte
        Antwort — ob sie stimmt oder nicht — und erfindet eine Vorschriftennummer ebenso bereitwillig,
        wie es eine richtige wiedergibt. Im Transport hat es zoll-, vertrags- und
        sicherheitsrechtliche Folgen, einer solchen Antwort zu folgen. Deshalb gelten die
        Anforderungen der{" "}
        <Link href={staticPath("sourcing-policy", "de")}>Quellenrichtlinien</Link> für jede
        sachliche Aussage, unabhängig davon, wie ein Entwurf entstanden ist.
      </p>
    </PolicyPage>
  );
}
