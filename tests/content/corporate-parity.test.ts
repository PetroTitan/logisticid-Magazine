/**
 * Main site ↔ Magazine parity on the publisher's identity.
 *
 * THE FAILURE THIS PREVENTS
 *
 * Two repositories, two deployments, one hostname, one company. Nothing in
 * either build forces them to agree about who publishes them, so the drift is
 * silent by construction: the main site's footer names the entity from a
 * registry with evidence behind every field, and this one could go on naming
 * a brand, or a stale company number, indefinitely. A reader who sees two
 * answers has no way to tell which is wrong, and neither deployment fails.
 *
 * THE MECHANISM
 *
 * `docs/company/corporate-identity.md` is held byte-for-byte identically in
 * both repositories. Each parses its canonical block and asserts its own
 * configuration against it. Neither repository imports the other, neither
 * needs the other present to build, and a change made on one side without the
 * other fails here — in whichever repository was not updated.
 *
 * The document is a projection, not the source. The main repository's
 * `src/config/corporate-identity.ts` carries each fact with its authority, its
 * verification method and its date, and that is what a change must start from.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import CorrectionsPage from "@/app/(en)/corrections/page";
import EditorialPolicyPage from "@/app/(en)/editorial-policy/page";
import { SiteFooter } from "@/components/site-footer";
import { publisher } from "@/config/publisher";
import { loadArticles, publishedArticles } from "@/content/load";
import { articleJsonLd } from "@/lib/jsonld";
import { mainSiteUrl } from "@/lib/site";

const ROOT = process.cwd();

function canonicalValues(): Readonly<Record<string, string>> {
  const document = readFileSync(
    join(ROOT, "docs/company/corporate-identity.md"),
    "utf8",
  );
  const block = /```\n([\s\S]*?)```/.exec(document);
  expect(block, "no canonical block in docs/company/corporate-identity.md").not.toBeNull();
  const entries = (block as RegExpExecArray)[1]!
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const at = line.indexOf(" = ");
      expect(at, `unparseable canonical line: ${line}`).toBeGreaterThan(0);
      return [line.slice(0, at).trim(), line.slice(at + 3).trim()] as const;
    });
  return Object.fromEntries(entries);
}

const canonical = canonicalValues();

function text(markup: string): string {
  return markup
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;|&#x[0-9a-f]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("the publisher this repository names", () => {
  it("agrees with the shared record on every field it holds", () => {
    expect(publisher.legalName).toBe(canonical["legal_name"]);
    expect(publisher.registrationNumber).toBe(canonical["registration_number"]);
    expect(publisher.registry).toBe(canonical["registry"]);
    expect(publisher.registryFileNumber).toBe(canonical["registry_file_number"]);
    expect(publisher.registeredOffice).toBe(canonical["registered_office_one_line"]);
    expect(publisher.contactEmail).toBe(canonical["primary_email"]);
    expect(publisher.canonicalDomain).toBe(canonical["canonical_domain"]);
  });

  it("agrees with the shared record on the canonical domain the site is deployed under", () => {
    /**
     * The origin is an environment variable, so the value the running
     * application uses cannot be asserted from a unit test — it is whatever
     * the deployment was given. What CAN be asserted is the value the
     * repository documents as the production origin, which is what a deploy is
     * configured from and what a reviewer reads.
     */
    const example = readFileSync(join(ROOT, ".env.example"), "utf8");
    const configured = /^NEXT_PUBLIC_SITE_ORIGIN=(.+)$/m.exec(example);
    expect(configured, "no NEXT_PUBLIC_SITE_ORIGIN in .env.example").not.toBeNull();
    expect(new URL((configured as RegExpExecArray)[1]!.trim()).host).toBe(
      canonical["canonical_domain"],
    );
    expect(publisher.canonicalDomain).toBe(canonical["canonical_domain"]);
  });

  it("holds no field the shared record does not cover", () => {
    // A value added here without a line in the document would be a fact this
    // repository publishes and the main site has never heard of.
    const covered = new Set([
      "brandName",
      "legalName",
      "registrationNumber",
      "registry",
      "registryFileNumber",
      "registeredOffice",
      "contactEmail",
      "canonicalDomain",
    ]);
    for (const key of Object.keys(publisher)) {
      expect(covered.has(key), `publisher.${key} is not covered by the parity test`).toBe(
        true,
      );
    }
  });
});

describe("what a reader of the Magazine is told", () => {
  const surfaces = [
    { path: "footer", markup: renderToStaticMarkup(createElement(SiteFooter)) },
    {
      path: "/editorial-policy",
      markup: renderToStaticMarkup(createElement(EditorialPolicyPage)),
    },
    { path: "/corrections", markup: renderToStaticMarkup(createElement(CorrectionsPage)) },
  ].map((surface) => ({ ...surface, body: text(surface.markup) }));

  it("names the same legal entity the main site names", () => {
    const footer = surfaces.find((surface) => surface.path === "footer")!;
    expect(footer.body).toContain(canonical["legal_name"]);
    expect(footer.body).toContain(canonical["registration_number"]);
  });

  it("publishes the imprint on the page that asks who is behind this", () => {
    const policy = surfaces.find((surface) => surface.path === "/editorial-policy")!;
    expect(policy.body).toContain(canonical["legal_name"]);
    expect(policy.body).toContain(canonical["registration_number"]);
    expect(policy.body).toContain(canonical["registry_file_number"]);
    expect(policy.body).toContain(canonical["registered_office_one_line"]);
  });

  it("shows the canonical contact address and no other", () => {
    let seen = 0;
    for (const surface of surfaces) {
      for (const match of surface.markup.matchAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)) {
        seen += 1;
        expect(match[0].toLowerCase(), surface.path).toBe(canonical["primary_email"]);
      }
    }
    expect(seen, "the Magazine shows no contact address at all").toBeGreaterThan(0);
  });

  it("lets no consumer mailbox appear anywhere a reader can see", () => {
    const consumerProvider =
      /@(gmail|googlemail|outlook|hotmail|live|yahoo|icloud|aol|proton|protonmail|gmx|seznam|centrum|volny)\.[a-z.]{2,}/i;
    for (const surface of surfaces) {
      expect(surface.markup, surface.path).not.toMatch(consumerProvider);
    }
  });

  it("never presents the registered office as a facility", () => {
    /**
     * REGISTERED OFFICE ≠ WAREHOUSE ≠ TERMINAL ≠ DEPOT ≠ EDITORIAL OFFICE.
     *
     * The imprint is the one place in the Magazine where a street address
     * appears, and it appears under the heading asking who publishes this —
     * which is exactly the context in which a reader would otherwise read it
     * as the newsroom's address.
     */
    const office = canonical["registered_office_one_line"] as string;
    let seen = 0;
    for (const surface of surfaces) {
      const at = surface.body.indexOf(office);
      if (at === -1) continue;
      seen += 1;
      const around = surface.body
        .slice(Math.max(0, at - 200), at + office.length + 400)
        .toLowerCase();
      for (const banned of ["visit us", "opening hours", "our warehouse", "our terminal"]) {
        expect(around, `${surface.path} presents the seat as ${banned}`).not.toContain(
          banned,
        );
      }
      // And the disclaimer is present, not merely the absence of a wrong word.
      expect(around).toContain("registered office");
      expect(around).toContain("not an editorial office");
    }
    expect(seen, "the imprint renders no address").toBe(1);
  });

  it("claims no VAT registration and constructs no DIČ", () => {
    const constructed = new RegExp(`\\bCZ[\\s-]?${canonical["registration_number"]}\\b`, "i");
    for (const surface of surfaces) {
      expect(surface.markup, surface.path).not.toMatch(constructed);
      const body = surface.body.toLowerCase();
      for (const claim of ["vat number", "vat registered", "dič", "vat id"]) {
        expect(body, `${surface.path} says "${claim}"`).not.toContain(claim);
      }
    }
  });
});

describe("the publisher node in every article's structured data", () => {
  const articles = publishedArticles(loadArticles());

  it("names the same entity, and states no fact the main site does not", () => {
    expect(articles.length).toBeGreaterThan(0);
    for (const article of articles) {
      const node = articleJsonLd(article)["publisher"] as Record<string, unknown>;
      expect(node["@type"]).toBe("Organization");
      expect(node["legalName"]).toBe(canonical["legal_name"]);
      /**
       * A reference to the entity, not a second declaration of it: the full
       * record — company number, address, contact address — is published once,
       * on the main site, at the URL this node points to.
       *
       * Compared against `mainSiteUrl()` rather than against the canonical
       * domain directly, because the origin is an environment variable and the
       * test suite runs without it — asserting the production host here would
       * fail on every correct local run. The canonical domain is checked
       * separately, against the value the deployment is actually configured
       * with.
       */
      expect(node["url"]).toBe(mainSiteUrl("/").href);
      const serialized = JSON.stringify(node);
      for (const banned of ["vatID", "taxID", "LocalBusiness", "GeoCoordinates"]) {
        expect(serialized, `publisher node carries ${banned}`).not.toContain(banned);
      }
    }
  });
});
