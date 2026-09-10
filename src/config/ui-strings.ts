import type { Locale } from "@/config/locales";

/**
 * Magazine interface strings, per language.
 *
 * Furniture only: navigation, landmarks, empty states, the language control.
 * Article text is not here — it lives in the article file, in its own
 * language, because a translation stored apart from the piece it translates is
 * a translation nobody reviews alongside it.
 *
 * The record is total over every locale and the shape is exact, so adding a
 * string without translating it fails `tsc` rather than falling back to
 * English at runtime.
 */
export type UiStrings = {
  readonly skipToContent: string;
  readonly sections: string;
  readonly latestArticles: string;
  readonly emptyState: string;
  readonly editorialStandards: string;
  readonly follow: string;
  readonly languageLabel: string;
  readonly standfirst: string;
  readonly publishedBy: string;
  readonly readInEnglishNote: string;

  /* Article furniture. */
  readonly magazineCrumb: string;
  /** The breadcrumb landmark's accessible name. */
  readonly breadcrumbLabel: string;
  readonly byline: string;
  readonly published: string;
  readonly updated: string;
  readonly minuteRead: string;
  readonly appliesTo: string;
  readonly positionChecked: string;
  readonly correction: string;
  readonly illustration: string;
  readonly updateHistory: string;
  readonly onTheMainSite: string;
  readonly relatedReading: string;
  readonly quotePrompt: string;
  readonly quoteLinkText: string;
};

export const uiStrings: Readonly<Record<Locale, UiStrings>> = {
  en: {
    skipToContent: "Skip to content",
    sections: "Sections",
    latestArticles: "Latest articles",
    emptyState: "No articles have been published yet.",
    editorialStandards: "Editorial standards",
    follow: "Follow",
    languageLabel: "Language",
    standfirst:
      "Explanations of how European road freight actually works, written for the people who have to arrange it. Every factual claim is sourced, and every article says where its guidance stops and a shipment-specific assessment begins.",
    publishedBy: "is published by",
    readInEnglishNote: "",
    magazineCrumb: "Magazine",
    breadcrumbLabel: "Breadcrumb",
    byline: "By",
    published: "Published",
    updated: "Updated",
    minuteRead: "min read",
    appliesTo: "Applies to:",
    positionChecked: "Position checked",
    correction: "Correction",
    illustration: "Illustration",
    updateHistory: "Update history",
    onTheMainSite: "On the LogisticID website",
    relatedReading: "Related reading",
    quotePrompt: "Have a shipment that needs arranging?",
    quoteLinkText: "Send the route, cargo and dates",
  },
  de: {
    skipToContent: "Zum Inhalt springen",
    sections: "Rubriken",
    latestArticles: "Neueste Beiträge",
    emptyState: "Auf Deutsch ist bislang kein Beitrag erschienen.",
    editorialStandards: "Redaktionelle Standards",
    follow: "Folgen",
    languageLabel: "Sprache",
    standfirst:
      "Wie europäischer Straßengüterverkehr tatsächlich funktioniert — geschrieben für die Menschen, die ihn organisieren müssen. Jede sachliche Aussage ist belegt, und jeder Beitrag benennt, wo seine Hinweise enden und die Prüfung einer konkreten Sendung beginnt.",
    publishedBy: "wird herausgegeben von",
    readInEnglishNote:
      "Die redaktionellen Richtlinien und das übrige Archiv liegen bislang nur auf Englisch vor.",
    magazineCrumb: "Magazin",
    breadcrumbLabel: "Brotkrumennavigation",
    byline: "Von",
    published: "Veröffentlicht",
    updated: "Aktualisiert",
    minuteRead: "Min. Lesezeit",
    appliesTo: "Gilt für:",
    positionChecked: "Stand geprüft",
    correction: "Korrektur",
    illustration: "Illustration",
    updateHistory: "Änderungsverlauf",
    onTheMainSite: "Auf der LogisticID-Website",
    relatedReading: "Weiterlesen",
    quotePrompt: "Sie haben eine Sendung zu organisieren?",
    // Deliberately says where the enquiry goes and not what happens to it. The
    // English pages on the main site were corrected once for claiming that a
    // person reads and answers every enquiry; German must not reintroduce it.
    quoteLinkText: "Strecke, Ware und Termine senden",
  },
};

export function strings(locale: Locale): UiStrings {
  return uiStrings[locale];
}
