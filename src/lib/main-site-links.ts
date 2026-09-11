import { defaultLocale, type Locale } from "@/config/locales";

/**
 * Where a link into the main LogisticID site should go, per language.
 *
 * THE PROBLEM THIS SOLVES, MEASURED ON A SERVED PAGE.
 *
 * The German article's "Auf der LogisticID-Website" list rendered a German
 * label — "LogisticID für Versender" — pointing at the English `/shippers`
 * page, with nothing saying so. A German label on an English destination is
 * worse than an English label: it promises a German page and delivers an
 * English one, and a screen reader announces the label in German and then
 * reads an English document.
 *
 * So a destination is one of two things and says which:
 *
 * - it has a German equivalent, and the German page links to it;
 * - it does not, and the link carries `lang="en"` and a visible marker, so
 *   changing language is a choice the reader makes rather than a surprise.
 *
 * The main site's route manifest is the authority for which is which. This is
 * a deliberately small mirror of it, kept here rather than fetched, because
 * the two applications deploy independently and a link must resolve at build
 * time.
 *
 * ## Why the mirror is now the WHOLE static manifest
 *
 * In Phase 4S-A it held four paths, because four was all the main site had
 * translated. Phases 4S-B1 to 4S-B5 translated the rest, and a mirror that
 * lists only some of what exists does not fail — it silently keeps sending
 * German readers to English pages and labelling them "(englisch)", which is a
 * true statement about a stale table rather than about the site. That is the
 * stale-marker defect the main site's Phase 4S-B4 found in its own footer, so
 * it is written down here in the form that cannot rot quietly: every static
 * route the main site publishes, including the four that deliberately have no
 * German version.
 *
 * `null` means "the main site has this page and has decided it stays English".
 * Absent means "this path is not in the manifest at all". Both produce an
 * English destination with a marker; recording the difference is what lets
 * `tests/content/corporate-parity.test.ts` tell a deliberate exception from a
 * forgotten entry.
 */
const GERMAN_EQUIVALENTS: Readonly<Record<string, string | null>> = {
  "/": "/de",

  /* Services */
  "/services": "/de/leistungen",
  "/freight-forwarding": "/de/spedition",
  "/road-freight": "/de/strassengueterverkehr",
  "/road-freight/ftl": "/de/strassengueterverkehr/komplettladung",
  "/road-freight/ltl": "/de/strassengueterverkehr/teilladung",
  "/road-freight/express": "/de/strassengueterverkehr/expressfracht",
  "/road-freight/pallets": "/de/strassengueterverkehr/palettenversand",
  "/road-freight/groupage": "/de/strassengueterverkehr/sammelgut",
  "/ocean-freight": "/de/seefracht",
  "/air-freight": "/de/luftfracht",
  "/rail-freight": "/de/schienengueterverkehr",
  "/multimodal": "/de/multimodal",
  "/warehousing": "/de/lagerung-distribution",
  "/customs": "/de/zoll",
  "/project-logistics": "/de/projektlogistik",
  "/supply-chain": "/de/lieferkette",

  /* Audiences and the commercial path */
  "/shippers": "/de/versender",
  "/carriers": "/de/transportunternehmen",
  "/carriers/standards": "/de/transportunternehmen/anforderungen",
  "/request-a-quote": "/de/frachtanfrage",
  "/become-a-carrier": "/de/transportpartner-werden",

  /* Registry hubs */
  "/routes": "/de/verkehrsrelationen",
  "/locations": "/de/maerkte",
  "/ports": "/de/haefen",
  "/air-cargo": "/de/luftfracht-drehkreuze",
  "/industries": "/de/branchen",
  "/equipment": "/de/equipment",
  "/resources": "/de/wissen",
  "/resources/incoterms": "/de/wissen/incoterms",
  "/resources/documents": "/de/wissen/transportdokumente",

  /* Company */
  "/about": "/de/ueber-uns",
  "/contact": "/de/kontakt",
  "/legal": "/de/impressum",
  "/image-credits": "/de/bildnachweise",

  /*
   * DELIBERATELY ENGLISH ON THE MAIN SITE, and therefore English here.
   *
   * `/team` publishes an empty team, so there is nothing to translate. The
   * three legal documents are `legal-review` in the main site's manifest: a
   * privacy notice or a set of terms in German is a reviewed document, not a
   * rendering of the English one, and the main site's Phase 4S-B1 decided that
   * honestly-marked English is better than unreviewed German legal prose.
   */
  "/team": null,
  "/privacy": null,
  "/terms": null,
  "/cookies": null,
};

/**
 * The Russian mirror of the main site's route manifest.
 *
 * Deliberately SMALLER than the German one, and that is the whole point of
 * modelling a missing translation as a missing value rather than a derivable
 * path. The main site's Phase 4U published its commercial core in Russian and
 * reserved the rest; a Magazine article that links to a main-site page with no
 * Russian version gets the English page and a visible marker, exactly as the
 * German edition did before its own corpus was complete.
 *
 * `null` means the main site publishes the page and has decided it stays
 * English. Absent means no Russian page exists YET. Both produce an English
 * destination with a marker; recording the difference is what lets a future
 * phase tell a deliberate exception from an entry nobody has added.
 */
const RUSSIAN_EQUIVALENTS: Readonly<Record<string, string | null>> = {
  "/": "/ru",
  "/services": "/ru/uslugi",
  "/freight-forwarding": "/ru/ekspedirovanie",
  "/road-freight": "/ru/avtomobilnye-gruzoperevozki",
  "/road-freight/ftl": "/ru/avtomobilnye-gruzoperevozki/polnaya-zagruzka",
  "/road-freight/ltl": "/ru/avtomobilnye-gruzoperevozki/chastichnaya-zagruzka",
  "/road-freight/express": "/ru/avtomobilnye-gruzoperevozki/ekspress-perevozki",
  "/road-freight/pallets": "/ru/avtomobilnye-gruzoperevozki/palletnye-perevozki",
  "/road-freight/groupage": "/ru/avtomobilnye-gruzoperevozki/sbornye-gruzy",
  "/shippers": "/ru/gruzootpravitelyam",
  "/carriers": "/ru/perevozchikam",
  "/carriers/standards": "/ru/perevozchikam/trebovaniya",
  "/request-a-quote": "/ru/zapros-stoimosti",
  "/become-a-carrier": "/ru/stat-partnerom",
  "/about": "/ru/o-kompanii",
  "/contact": "/ru/kontakty",
  "/legal": "/ru/pravovaya-informatsiya",
  "/image-credits": "/ru/prava-na-izobrazheniya",

  /* Deliberately English on the main site, in every language. */
  "/team": null,
  "/privacy": null,
  "/terms": null,
  "/cookies": null,
};

const EQUIVALENTS_BY_LOCALE: Readonly<
  Partial<Record<Locale, Readonly<Record<string, string | null>>>>
> = {
  de: GERMAN_EQUIVALENTS,
  ru: RUSSIAN_EQUIVALENTS,
};

export type MainSiteTarget = {
  /** The path on the main site, already localized where possible. */
  readonly path: string;
  /** True when the destination is not in the reader's language. */
  readonly foreignLanguage: boolean;
};

export function mainSiteTarget(path: string, locale: Locale): MainSiteTarget {
  if (locale === defaultLocale) return { path, foreignLanguage: false };
  const translated = EQUIVALENTS_BY_LOCALE[locale]?.[path];
  return translated === undefined || translated === null
    ? { path, foreignLanguage: true }
    : { path: translated, foreignLanguage: false };
}

/** Every main-site path this mirror knows, for the parity test. */
export function mirroredMainSitePaths(locale: Locale = "de"): readonly string[] {
  return Object.keys(EQUIVALENTS_BY_LOCALE[locale] ?? {});
}

/** Paths the main site publishes in English only, on purpose. */
export function englishOnlyMainSitePaths(locale: Locale = "de"): readonly string[] {
  return Object.entries(EQUIVALENTS_BY_LOCALE[locale] ?? {})
    .filter(([, translated]) => translated === null)
    .map(([path]) => path);
}

/** The marker appended to a label whose destination is in another language. */
export const FOREIGN_LANGUAGE_MARKER: Readonly<Record<Locale, string>> = {
  en: "",
  de: " (englisch)",
  ru: " (на английском)",
};
