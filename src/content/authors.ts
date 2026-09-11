import type { Locale } from "@/config/locales";
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
 * these articles is an `Organization`, not a `Person`.
 *
 * ## Why the byline has a German rendering and the publisher does not
 *
 * "LogisticID Magazine editorial team" is a DESCRIPTION of who wrote the piece,
 * not a registered name, so a German article says it in German. The publisher
 * is the opposite: `LogisticID s.r.o.` is an entry in the Prague Commercial
 * Register, it is the same string in every language, and rendering it as
 * anything else would invent a second company. See `src/config/publisher.ts`.
 *
 * A NAMED PERSON WOULD NOT BE TRANSLATED EITHER. When real colleagues are
 * published, `name` is their name in both languages; only `role` and `bio`
 * take a German rendering.
 */

export type AuthorLabels = {
  name: string;
  role: string;
  bio: string;
};

export type MagazineAuthor = {
  slug: string;
  /**
   * True when the byline is LogisticID itself rather than a named person.
   *
   * Read by the JSON-LD builder to emit `Organization` instead of `Person`,
   * so the structured data states what is actually true about who wrote this.
   */
  isOrganization: boolean;
  labels: Readonly<Record<Locale, AuthorLabels>>;
};

export const authors: readonly MagazineAuthor[] = [
  {
    slug: "logisticid-editorial-team",
    isOrganization: true,
    labels: {
      en: {
        name: "LogisticID Magazine editorial team",
        role: "Editorial team",
        bio: "LogisticID Magazine is written and edited by the LogisticID team. Articles are attributed to the editorial team rather than to a named individual, because LogisticID does not yet publish individual colleague profiles. Every factual claim is sourced to the references listed with the article.",
      },
      de: {
        name: "Redaktion LogisticID Magazine",
        role: "Redaktion",
        bio: "LogisticID Magazine wird vom LogisticID-Team geschrieben und redigiert. Die Beiträge sind der Redaktion zugeschrieben und nicht einer namentlich genannten Person, weil LogisticID bislang keine Profile einzelner Mitarbeiterinnen und Mitarbeiter veröffentlicht. Jede sachliche Aussage ist in den Quellen belegt, die beim Beitrag stehen.",
      },
    },
  },
];

export function getAuthor(slug: string): MagazineAuthor | undefined {
  return authors.find((author) => author.slug === slug);
}

/** An author's visible name, role and biography in one language. */
export function authorLabels(author: MagazineAuthor, locale: Locale): AuthorLabels {
  return author.labels[locale];
}

/** Kept so `Author` stays the shape other code describes. */
export type { Author };
