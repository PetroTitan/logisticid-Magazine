/**
 * Who publishes this Magazine, as a legal entity.
 *
 * WHY THIS FILE IS A MIRROR AND NOT A SOURCE
 *
 * The main LogisticID repository owns the company's identity in
 * `src/config/corporate-identity.ts`, where every fact carries the authority
 * that issued it, how it was checked and on what day, and where a fact whose
 * provenance cannot support the claim is refused. Nothing here reproduces that
 * machinery, and nothing here should: a second evidence model would be a
 * second thing to keep right, and the weaker of the two would win by being
 * easier to edit.
 *
 * What the two repositories share instead is `docs/company/corporate-identity.md`,
 * held byte-for-byte identically in both. `tests/content/corporate-parity.test.ts`
 * parses that document's canonical block and asserts every value below matches
 * it, so this file cannot drift from the main site without a test failing here.
 *
 * The alternative was a shared package. It would couple two deployments that
 * are deliberately independent — the Magazine ships without the main site and
 * the main site without the Magazine — in order to carry four strings.
 *
 * WHAT IS DELIBERATELY ABSENT
 *
 * No VAT number: the company is not registered for VAT, and a Czech DIČ is
 * written as CZ plus exactly the company number, which makes an invented one
 * one concatenation away. No telephone, no bank details, no directors, no
 * `sameAs`. The registered office is a seat for service of documents and is
 * never described as a warehouse, terminal, depot, branch or an office anyone
 * may visit — LogisticID arranges transport that independent carriers perform
 * and operates no facility.
 */

export const publisher = {
  /** The brand a reader recognises. Not the entity they would contract with. */
  brandName: "LogisticID",
  /** The registered legal name of the operating company. */
  legalName: "LogisticID s.r.o.",
  /** The Czech company identification number (IČO). NOT a VAT number. */
  registrationNumber: "29957516",
  /** The Commercial Register the company is entered in. */
  registry: "Obchodní rejstřík vedený Městským soudem v Praze",
  /** The file number under which the entry sits. */
  registryFileNumber: "C 455016",
  /**
   * The registered office, in the register's own one-line rendering.
   *
   * A seat, not a place of business. See the note at the top of this file.
   */
  registeredOffice: "Petrská 1166/33, Nové Město, 110 00 Praha 1, Czech Republic",
  /**
   * The corporate contact address.
   *
   * Owner-declared rather than delivery-tested: the main repository records it
   * as `declared`, meaning the owner of the domain and the company designates
   * it, and that nobody has yet sent to it from outside and watched it arrive.
   * Nothing here may describe it as verified.
   */
  contactEmail: "contact@logisticid.com",
  /** The only public identity either application has. */
  canonicalDomain: "logisticid.com",
} as const;
