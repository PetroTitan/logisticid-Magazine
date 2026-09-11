import type { Locale } from "@/config/locales";
import type { Section, SectionLabels } from "@/content/types";

/**
 * The Magazine's sections.
 *
 * A section exists here only when there is published work to put in it. An
 * empty section is an indexable page that promises coverage the publication
 * does not have, so sections are added as the corpus reaches them rather than
 * laid out in advance — `validateCorpus` refuses a section with no published
 * articles for exactly that reason.
 *
 * ## Identity is language-neutral; the LABELS are not
 *
 * `slug` is the section's identity and stays as it is in every language: it is
 * an identifier, it is in the URL of an article that is already public, and
 * translating it would move pages rather than name them. What a reader sees is
 * `labels`, which is total over the locales — so adding a language fails `tsc`
 * here until somebody writes the German name, instead of silently printing the
 * English one on a German page. That silent English label is exactly what the
 * main site's Phase 4S-B5 audit found on 184 German pages, and it is invisible
 * in review because the page around it is correct.
 */
export const sections: readonly Section[] = [
  {
    slug: "road-freight",
    labels: {
      en: {
        name: "Road freight",
        description:
          "How European road freight actually works: load types, equipment, planning and documentation.",
        intro:
          "Explanations of the mechanics of road freight — what distinguishes the load types, what equipment and handling a shipment needs, and what has to be agreed before a truck is booked.",
      },
      de: {
        name: "Straßengüterverkehr",
        description:
          "Wie europäischer Straßengüterverkehr tatsächlich funktioniert: Ladungsarten, Equipment, Planung und Dokumente.",
        intro:
          "Erklärungen zur Mechanik des Straßengüterverkehrs — was die Ladungsarten voneinander unterscheidet, welches Equipment und welche Handhabung eine Sendung braucht und was feststehen muss, bevor ein Fahrzeug gebucht wird.",
      },
      ru: {
        name: "Автомобильные перевозки",
        description:
          "Как на самом деле работают европейские автомобильные грузоперевозки: типы загрузки, транспорт, планирование и документы.",
        intro:
          "Разборы механики автомобильных перевозок — что отличает типы загрузки друг от друга, какой транспорт и какая обработка нужны отправке и что должно быть решено до того, как машина забронирована.",
      },
    },
  },
  {
    slug: "shipping-guides",
    labels: {
      en: {
        name: "Shipping guides",
        description:
          "Practical guidance for shippers preparing freight, requesting quotes and working with carriers.",
        intro:
          "Working guidance for the shipper's side of a shipment: what information a forwarder needs, how to describe cargo accurately, and where planning most often goes wrong.",
      },
      de: {
        name: "Versandleitfäden",
        description:
          "Praxisnahe Hinweise für Versender: Ware vorbereiten, Frachtanfragen stellen und mit Transportunternehmen arbeiten.",
        intro:
          "Hinweise für die Seite des Versenders: welche Angaben eine Spedition braucht, wie sich Ware so beschreiben lässt, dass die Beschreibung an der Rampe standhält, und woran die Planung am häufigsten scheitert.",
      },
      ru: {
        name: "Практика отправок",
        description:
          "Практические указания для грузоотправителей: подготовить груз, запросить стоимость и работать с транспортными компаниями.",
        intro:
          "Указания для стороны грузоотправителя: какие сведения нужны экспедитору, как описать груз так, чтобы описание выдержало встречу с рампой, и на чём чаще всего срывается планирование.",
      },
    },
  },
  {
    slug: "logisticid",
    labels: {
      en: {
        name: "About the Magazine",
        description:
          "How LogisticID Magazine works, what it publishes, and how it sources its material.",
        intro:
          "The publication's own record: what it is for, how claims are sourced and checked, and what it will not publish.",
      },
      de: {
        name: "Über das Magazin",
        description:
          "Wie LogisticID Magazine arbeitet, was es veröffentlicht und woher es sein Material bezieht.",
        intro:
          "Die Rechenschaft der Redaktion über sich selbst: wozu diese Publikation da ist, wie Aussagen belegt und geprüft werden und was hier nicht erscheint.",
      },
      ru: {
        name: "О журнале",
        description:
          "Как работает LogisticID Magazine, что он публикует и откуда берёт материал.",
        intro:
          "Отчёт редакции о себе: зачем существует эта публикация, как утверждения подкрепляются и проверяются и что здесь не появляется.",
      },
    },
  },
];

export function getSection(slug: string): Section | undefined {
  return sections.find((section) => section.slug === slug);
}

/**
 * A section's visible name, description and standfirst in one language.
 *
 * The only way to read a section's display text. `Section` carries no
 * top-level `name`, so a caller that forgets the locale does not compile —
 * which is the difference between a rule and a convention.
 */
export function sectionLabels(section: Section, locale: Locale): SectionLabels {
  return section.labels[locale];
}
