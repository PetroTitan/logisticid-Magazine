import type { Section } from "@/content/types";

/**
 * The Magazine's sections.
 *
 * A section exists here only when there is published work to put in it. An
 * empty section is an indexable page that promises coverage the publication
 * does not have, so sections are added as the corpus reaches them rather than
 * laid out in advance — `validateCorpus` refuses a section with no published
 * articles for exactly that reason.
 */
export const sections: readonly Section[] = [
  {
    slug: "road-freight",
    name: "Road freight",
    description:
      "How European road freight actually works: load types, equipment, planning and documentation.",
    intro:
      "Explanations of the mechanics of road freight — what distinguishes the load types, what equipment and handling a shipment needs, and what has to be agreed before a truck is booked.",
  },
  {
    slug: "shipping-guides",
    name: "Shipping guides",
    description:
      "Practical guidance for shippers preparing freight, requesting quotes and working with carriers.",
    intro:
      "Working guidance for the shipper's side of a shipment: what information a forwarder needs, how to describe cargo accurately, and where planning most often goes wrong.",
  },
  {
    slug: "logisticid",
    name: "About the Magazine",
    description: "How LogisticID Magazine works, what it publishes, and how it sources its material.",
    intro:
      "The publication's own record: what it is for, how claims are sourced and checked, and what it will not publish.",
  },
];

export function getSection(slug: string): Section | undefined {
  return sections.find((section) => section.slug === slug);
}
