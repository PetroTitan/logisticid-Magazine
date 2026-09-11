import type { Locale } from "@/config/locales";
import type { SourceType } from "@/content/types";

/**
 * Magazine interface strings, per language.
 *
 * Furniture only: navigation, landmarks, empty states, the language control,
 * the labels around a citation. Article text is not here — it lives in the
 * article file, in its own language, because a translation stored apart from
 * the piece it translates is a translation nobody reviews alongside it.
 *
 * The record is total over every locale and the shape is exact, so adding a
 * string without translating it fails `tsc` rather than falling back to
 * English at runtime.
 *
 * WHY THIS FILE GREW IN PHASE 4T. The main site's Phase 4S-B5 audit found that
 * the last English on a German site is never the prose — it is the frame: a
 * card that says "min read", a reference list headed "References", a status
 * label nobody reads until a screen reader reads it. Every one of those traced
 * to a string that was written inline in a component instead of here. So the
 * rule is now the file: a visible string that is not the article's own belongs
 * in this dictionary, and a component that writes one inline is a defect
 * waiting for a second language.
 */
export type UiStrings = {
  readonly skipToContent: string;
  readonly sections: string;
  readonly latestArticles: string;
  readonly emptyState: string;
  readonly emptySection: string;
  readonly editorialStandards: string;
  readonly follow: string;
  readonly languageLabel: string;
  readonly standfirst: string;
  readonly publishedBy: string;
  readonly readInEnglishNote: string;
  /** The feed's channel title and description. */
  readonly feedTitle: string;
  readonly feedDescription: string;

  /* Index and section furniture. */
  readonly homeTitle: string;
  readonly sectionEyebrow: string;

  /* Article furniture. */
  /** The masthead link's accessible name. */
  readonly brandHome: string;
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

  /* Callouts inside the article body. */
  readonly noteBoundary: string;
  readonly noteContext: string;
  /** `{number}` is substituted. The accessible name of a citation marker. */
  readonly citationLabel: string;
  /** The accessible name of a horizontally scrollable table. */
  readonly tableLabel: string;

  /* The reference list. Labels only — never a source's own text. */
  readonly references: string;
  readonly accessed: string;
  readonly partialConsultation: string;
  readonly sourceTypes: Readonly<Record<SourceType, string>>;

  /* Editorial-standards pages and the footer entries that reach them. */
  readonly editorialPolicy: string;
  readonly sourcingPolicy: string;
  readonly imagePolicy: string;
  readonly corrections: string;
  readonly authors: string;
  readonly search: string;
  readonly rssFeed: string;
  readonly atomFeed: string;
  readonly jsonFeed: string;

  /* The footer's routes back to the main LogisticID site. */
  readonly mainHome: string;
  readonly mainRoadFreight: string;
  readonly mainShippers: string;
  readonly mainCarriers: string;
  readonly mainContact: string;

  /* Author pages. */
  readonly articlesHeading: string;
  readonly noArticlesForByline: string;

  /* Search. */
  readonly searchStandfirst: string;
  readonly searchFieldLabel: string;
  readonly searchPlaceholder: string;
  readonly searchSubmit: string;
  readonly searchIndexFailed: string;
  readonly searchIndexFailedLinkText: string;
  readonly searchIndexFailedTail: string;
  readonly searchPrompt: string;
  readonly searchLoading: string;
  /** `{query}` is substituted. */
  readonly searchNoResults: string;
  /** `{count}` and `{query}` are substituted. */
  readonly searchResultsOne: string;
  readonly searchResultsMany: string;

  /* 404. */
  readonly notFoundTitle: string;
  /** A complete sentence: the 404 is bilingual and carries no inline links. */
  readonly notFoundBody: string;
  readonly notFoundTryThese: string;
  readonly notFoundHome: string;
  readonly notFoundSearch: string;
  readonly notFoundMainSite: string;
};

export const uiStrings: Readonly<Record<Locale, UiStrings>> = {
  en: {
    skipToContent: "Skip to content",
    sections: "Sections",
    latestArticles: "Latest articles",
    emptyState: "No articles have been published yet.",
    emptySection: "No articles have been published in this section yet.",
    editorialStandards: "Editorial standards",
    follow: "Follow",
    languageLabel: "Language",
    standfirst:
      "Explanations of how European road freight actually works, written for the people who have to arrange it. Every factual claim is sourced, and every article says where its guidance stops and a shipment-specific assessment begins.",
    publishedBy: "is published by",
    readInEnglishNote: "",
    feedTitle: "LogisticID Magazine",
    feedDescription:
      "European road freight insight, practical shipping guidance and logistics intelligence from LogisticID.",

    homeTitle:
      "European road freight insight, practical shipping guidance and logistics intelligence from LogisticID.",
    sectionEyebrow: "Section",

    brandHome: "LogisticID Magazine home",
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

    noteBoundary: "Where this stops and a professional starts",
    noteContext: "Context",
    citationLabel: "Reference {number}",
    tableLabel: "Table",

    references: "References",
    accessed: "Accessed",
    partialConsultation:
      "Consulted as an abstract or summary; the full text is not openly accessible and is not represented here as having been read in full.",
    sourceTypes: {
      legislation: "Legislation",
      "official-guidance": "Official guidance",
      statistics: "Official statistics",
      "research-paper": "Research paper",
      "institutional-report": "Institutional report",
      standard: "Standard",
      "technical-documentation": "Technical documentation",
      "company-announcement": "Company announcement",
      news: "News report",
    },

    editorialPolicy: "Editorial policy",
    sourcingPolicy: "Sourcing policy",
    imagePolicy: "Image and AI policy",
    corrections: "Corrections",
    authors: "Authors",
    search: "Search",
    rssFeed: "RSS feed",
    atomFeed: "Atom feed",
    jsonFeed: "JSON Feed",

    mainHome: "Home",
    mainRoadFreight: "Road freight",
    mainShippers: "For shippers",
    mainCarriers: "For carriers",
    mainContact: "Contact",

    articlesHeading: "Articles",
    noArticlesForByline: "No published articles carry this byline yet.",

    searchStandfirst:
      "Searches run entirely in your browser against a generated index. Nothing you type is sent anywhere.",
    searchFieldLabel: "Search LogisticID Magazine",
    searchPlaceholder: "Search articles",
    searchSubmit: "Search",
    searchIndexFailed: "The search index could not be loaded. Every article is still reachable from the",
    searchIndexFailedLinkText: "Magazine home page",
    searchIndexFailedTail: "and the section pages.",
    searchPrompt: "Type a term to search published articles.",
    searchLoading: "Loading the search index…",
    searchNoResults: "No published article matches “{query}”.",
    searchResultsOne: "{count} article matches “{query}”.",
    searchResultsMany: "{count} articles match “{query}”.",

    notFoundTitle: "This page does not exist",
    notFoundBody:
      "The address may be mistyped, or the article may never have been published. Nothing has been removed to hide it — corrections and withdrawals are recorded on the corrections page.",
    notFoundTryThese: "Try one of these",
    notFoundHome: "LogisticID Magazine home",
    notFoundSearch: "Search the Magazine",
    notFoundMainSite: "The main LogisticID website",
  },
  de: {
    skipToContent: "Zum Inhalt springen",
    sections: "Rubriken",
    latestArticles: "Neueste Beiträge",
    emptyState: "Auf Deutsch ist bislang kein Beitrag erschienen.",
    emptySection: "In dieser Rubrik ist auf Deutsch bislang kein Beitrag erschienen.",
    editorialStandards: "Redaktionelle Standards",
    follow: "Folgen",
    languageLabel: "Sprache",
    standfirst:
      "Wie europäischer Straßengüterverkehr tatsächlich funktioniert — geschrieben für die Menschen, die ihn organisieren müssen. Jede sachliche Aussage ist belegt, und jeder Beitrag benennt, wo seine Hinweise enden und die Prüfung einer konkreten Sendung beginnt.",
    publishedBy: "wird herausgegeben von",
    /*
     * Empty since Phase 4T. It read "the editorial guidelines and the rest of
     * the archive are available in English only" — true when the German
     * edition was one pilot article, and false the moment the corpus, the
     * standards pages and the author pages were published in German. A note
     * that has stopped being true is worse than no note: it sends a German
     * reader to an English page that now exists in their language.
     */
    readInEnglishNote: "",
    // The language is in the title because a feed reader shows the channel
    // name and nothing else, and a subscriber with both feeds needs to tell
    // them apart before opening either.
    feedTitle: "LogisticID Magazine — Deutsch",
    feedDescription:
      "Europäischer Straßengüterverkehr, erklärt: Ladungsarten, Versandpraxis und wie sich Frachtangaben einordnen lassen — von LogisticID.",

    homeTitle: "Europäischer Straßengüterverkehr, erklärt",
    sectionEyebrow: "Rubrik",

    brandHome: "LogisticID Magazine — Startseite",
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

    /*
     * MEASURED ON THE LIVE GERMAN PAGE. "Where this stops and a professional
     * starts" was printed three times on `/magazine/de/shipping-guides/…`,
     * because the label lived inline in `prose.tsx`. It is the single most
     * important sentence in a freight article — the point at which a reader
     * must stop acting on it — and it was in a language the reader of that
     * page had not chosen.
     */
    noteBoundary: "Wo dieser Beitrag endet und Fachkunde beginnt",
    noteContext: "Zum Hintergrund",
    // What a screen reader announces at a citation marker. It was "Reference
    // 1" on the German article, which is the same defect with no visible trace
    // at all.
    citationLabel: "Quelle {number}",
    tableLabel: "Tabelle",

    references: "Quellen",
    accessed: "Abgerufen am",
    partialConsultation:
      "Als Abstract oder Zusammenfassung eingesehen; der Volltext ist nicht frei zugänglich und wird hier nicht als vollständig gelesen ausgegeben.",
    /*
     * The KIND of source, which is a label and therefore translated. What the
     * source itself says — its title, its publisher, its date, its report
     * number — is evidence and stays exactly as published, in whatever
     * language it was published in. That line is the whole citation policy in
     * one sentence, and it is the line Phase 4S-B5 found people cross.
     */
    sourceTypes: {
      legislation: "Rechtsvorschrift",
      "official-guidance": "Amtliche Hinweise",
      statistics: "Amtliche Statistik",
      "research-paper": "Wissenschaftliche Arbeit",
      "institutional-report": "Institutioneller Bericht",
      standard: "Norm",
      "technical-documentation": "Technische Dokumentation",
      "company-announcement": "Unternehmensmitteilung",
      news: "Pressebericht",
    },

    editorialPolicy: "Redaktionsrichtlinien",
    sourcingPolicy: "Quellenrichtlinien",
    imagePolicy: "Bild- und KI-Richtlinien",
    corrections: "Korrekturen",
    authors: "Autoren",
    search: "Suche",
    rssFeed: "RSS-Feed",
    atomFeed: "Atom-Feed",
    jsonFeed: "JSON-Feed",

    mainHome: "Startseite",
    mainRoadFreight: "Straßengüterverkehr",
    mainShippers: "Für Versender",
    // Transportunternehmen, as on the main site. Never "Frachtführer" as a
    // label for the audience: that is the § 407 HGB role, and the page it
    // links to addresses companies that may or may not be acting in it.
    mainCarriers: "Für Transportunternehmen",
    mainContact: "Kontakt",

    articlesHeading: "Beiträge",
    noArticlesForByline: "Unter dieser Autorenzeile ist bislang kein Beitrag erschienen.",

    searchStandfirst:
      "Die Suche läuft vollständig in Ihrem Browser gegen einen erzeugten Index. Was Sie eingeben, wird nirgendwohin gesendet.",
    searchFieldLabel: "LogisticID Magazine durchsuchen",
    searchPlaceholder: "Beiträge durchsuchen",
    searchSubmit: "Suchen",
    searchIndexFailed:
      "Der Suchindex konnte nicht geladen werden. Jeder Beitrag ist weiterhin erreichbar über die",
    searchIndexFailedLinkText: "Übersicht des Magazins",
    searchIndexFailedTail: "und die Rubrikseiten.",
    searchPrompt: "Geben Sie einen Begriff ein, um veröffentlichte Beiträge zu durchsuchen.",
    searchLoading: "Der Suchindex wird geladen …",
    // German quotation marks throughout. „…“ is not decoration: “…” inside
    // German prose is the typographic tell of a translated interface.
    searchNoResults: "Kein veröffentlichter Beitrag passt zu „{query}“.",
    searchResultsOne: "{count} Beitrag passt zu „{query}“.",
    searchResultsMany: "{count} Beiträge passen zu „{query}“.",

    notFoundTitle: "Diese Seite gibt es nicht",
    notFoundBody:
      "Möglicherweise ist die Adresse falsch geschrieben, oder der Beitrag ist nie erschienen. Nichts wurde entfernt, um es zu verbergen — Korrekturen und Rücknahmen sind auf der Korrekturseite verzeichnet.",
    notFoundTryThese: "Vielleicht eine dieser Seiten",
    notFoundHome: "Übersicht von LogisticID Magazine",
    notFoundSearch: "Das Magazin durchsuchen",
    notFoundMainSite: "Die LogisticID-Website",
  },
};

export function strings(locale: Locale): UiStrings {
  return uiStrings[locale];
}
