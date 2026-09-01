/**
 * The editorial schema of LogisticID Magazine.
 *
 * Everything publishable is described here, and every rule that makes a
 * document publishable is enforced against these types at build time by
 * `src/content/validate.ts`. There is no path by which an article reaches a
 * reader without passing that validation.
 */

/**
 * Where an article is in the editorial process.
 *
 * Only PUBLISHED and UPDATED are ever indexable or listed. The other states
 * exist so that work in progress can live in the repository — and be reviewed
 * in a pull request — without being publicly readable.
 */
export type ArticleStatus =
  | "DRAFT"
  | "REVIEW"
  | "SCHEDULED"
  | "PUBLISHED"
  | "UPDATED"
  | "ARCHIVED";

export const PUBLIC_STATUSES = ["PUBLISHED", "UPDATED"] as const satisfies readonly ArticleStatus[];

/**
 * Schema.org type for an article.
 *
 * `NewsArticle` is reserved for genuinely time-sensitive reporting. An
 * evergreen explainer marked as news is a misrepresentation to search engines
 * of what the page is, so the choice is explicit per article and validated
 * rather than inferred from the section.
 */
export type ArticleSchemaType = "Article" | "NewsArticle";

/** What kind of thing a cited source is. Drives how it is presented. */
export type SourceType =
  | "legislation"
  | "official-guidance"
  | "statistics"
  | "research-paper"
  | "institutional-report"
  | "standard"
  | "technical-documentation"
  | "company-announcement"
  | "news";

/**
 * A single cited source.
 *
 * `accessedAt` is the date a human actually opened the source. It is never
 * generated, defaulted or set to "today" by a build step: a fabricated access
 * date is a false claim about editorial work that was not done.
 */
export type Source = {
  /** Stable identifier, referenced from the article body as [^id]. */
  id: string;
  title: string;
  /** The author, or the organisation responsible where there is no named author. */
  authorsOrOrganization: string;
  /** The publication, journal, register or series this appeared in, if any. */
  publication?: string;
  /** Publication date of the source, as an ISO 8601 date. */
  date?: string;
  url?: string;
  doi?: string;
  reportNumber?: string;
  sourceType: SourceType;
  /** ISO 8601 date on which the source was actually consulted. */
  accessedAt: string;
  /**
   * Set when only an abstract, summary or table of contents was accessible —
   * a paywalled standard, for example. The article must not then present the
   * full text as read.
   */
  fullTextConsulted?: false;
};

/**
 * Provenance for an image.
 *
 * Every field is required because an image whose rights cannot be stated is an
 * image that cannot be published. `width` and `height` are required so that
 * the layout reserves the right space and the image cannot cause layout shift.
 */
export type ImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Where the file came from — an archive, a photographer, or LogisticID. */
  source: string;
  /** Who made it. */
  creator: string;
  /** The licence it is used under, named precisely. */
  license: string;
  /** Canonical URL of the original, where one exists. */
  sourceUrl?: string;
  /** The credit line rendered next to the image. */
  credit: string;
  /**
   * True when the image is a diagram, illustration or generated image rather
   * than a photograph of the thing described. Rendered as a visible label, so
   * that an illustration is never mistaken for documentary evidence.
   */
  illustrative?: boolean;
};

/** A link from an article to a page on the main LogisticID site. */
export type RelatedLogisticIDEntity =
  | { type: "service"; slug: "ftl" | "ltl" | "express" | "pallets" }
  | { type: "audience"; slug: "shippers" | "carriers" }
  | { type: "page"; path: string };

/** One entry in an article's revision history. */
export type UpdateRecord = {
  date: string;
  /** What changed, in a sentence a reader can act on. */
  note: string;
};

export type Author = {
  slug: string;
  name: string;
  /**
   * The role this person holds in relation to the Magazine.
   *
   * Never a credential, licence, qualification or employment claim that has
   * not been verified — see docs/EDITORIAL-STANDARDS.md.
   */
  role: string;
  bio: string;
};

export type Section = {
  slug: string;
  name: string;
  /** One line describing the section, shown on the section page and in listings. */
  description: string;
  /** Longer standfirst for the section index. */
  intro: string;
};

/**
 * A parsed, validated article ready to render.
 *
 * `body` is a typed block tree, not an HTML string. Editorial Markdown is
 * parsed into this structure and rendered as React elements, so no article can
 * inject markup or script into the page even if the source file tries to.
 */
export type Article = {
  id: string;
  slug: string;
  section: string;
  title: string;
  /** The standfirst: one sentence expanding the headline. */
  subtitle: string;
  /** Meta description and listing summary. */
  description: string;
  tags: string[];
  authors: string[];
  datePublished: string;
  dateModified?: string;
  status: ArticleStatus;
  featured: boolean;
  heroImage?: ImageAsset;
  /** Estimated reading time in minutes, computed from the body. */
  readingTime: number;
  /** The article's own summary of what it establishes. */
  summary: string;
  body: Block[];
  sources: Source[];
  relatedLogisticID: RelatedLogisticIDEntity[];
  relatedArticles: string[];
  seoTitle?: string;
  seoDescription?: string;
  socialTitle?: string;
  socialDescription?: string;
  schemaType: ArticleSchemaType;
  updateHistory: UpdateRecord[];
  /** Set when a correction has been issued. Rendered prominently. */
  correctionNote?: string;
  /**
   * The jurisdiction whose rules the article describes, where it describes
   * any. Regulatory content that does not say where it applies is unsafe.
   */
  jurisdiction?: string;
  /**
   * The date the factual position described was checked. Distinct from
   * `dateModified`, which also moves for a typo fix.
   */
  informationCurrentAsOf?: string;
};

/* ------------------------------------------------------------------ */
/* Body block tree                                                     */
/* ------------------------------------------------------------------ */

export type Inline =
  | { kind: "text"; value: string }
  | { kind: "strong"; children: Inline[] }
  | { kind: "emphasis"; children: Inline[] }
  | { kind: "code"; value: string }
  | { kind: "link"; href: string; external: boolean; children: Inline[] }
  /** A reference to a source, rendered as a numbered, linked citation. */
  | { kind: "citation"; sourceId: string };

export type Block =
  | { kind: "heading"; level: 2 | 3; id: string; children: Inline[] }
  | { kind: "paragraph"; children: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "quote"; children: Inline[]; attribution?: string }
  | { kind: "table"; head: Inline[][]; rows: Inline[][][] }
  /**
   * A callout carrying a professional boundary — the point at which a reader
   * must consult someone rather than act on the article.
   */
  | { kind: "note"; variant: "boundary" | "context"; children: Inline[] };
