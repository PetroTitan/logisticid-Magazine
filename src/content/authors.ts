import type { Author } from "@/content/types";

/**
 * Bylines available to LogisticID Magazine.
 *
 * BINDING RULE (docs/EDITORIAL-STANDARDS.md): only a real, verified person who
 * has agreed to be published may appear here as a named author. Never invent a
 * writer, a job title, a qualification, a licence, an employment history or a
 * biography.
 *
 * ## Why the only byline today is the editorial team
 *
 * The main LogisticID site publishes no team members at all: `src/data/team.ts`
 * in that repository is deliberately an empty list, because the business has
 * not yet supplied verified details for anyone. Inventing a freight editor for
 * the Magazine — or borrowing a plausible-sounding name — would put a fictional
 * person's expertise behind advice about customs, sanctions and dangerous
 * goods. That is the most damaging kind of fabrication this publication could
 * commit, because a reader's trust in the advice is exactly what the byline is
 * for.
 *
 * So articles are attributed to the editorial team as an organisation. This is
 * true, it is checkable, and Schema.org models it directly: the `author` of
 * these articles is an `Organization`, not a `Person`. Named individual bylines
 * become available the moment real colleagues are published — add them here,
 * set `isOrganization: false`, and nothing else in the application changes.
 */

export type MagazineAuthor = Author & {
  /**
   * True when the byline is LogisticID itself rather than a named person.
   *
   * Read by the JSON-LD builder to emit `Organization` instead of `Person`,
   * so the structured data states what is actually true about who wrote this.
   */
  isOrganization: boolean;
};

export const authors: readonly MagazineAuthor[] = [
  {
    slug: "logisticid-editorial-team",
    name: "LogisticID Magazine editorial team",
    role: "Editorial team",
    bio:
      "LogisticID Magazine is written and edited by the LogisticID team. Articles are attributed to the editorial team rather than to a named individual, because LogisticID does not yet publish individual colleague profiles. Every factual claim is sourced to the references listed with the article.",
    isOrganization: true,
  },
];

export function getAuthor(slug: string): MagazineAuthor | undefined {
  return authors.find((author) => author.slug === slug);
}
