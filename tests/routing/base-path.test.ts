import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BASE_PATH } from "@/lib/site";

/**
 * Structural routing invariants.
 *
 * The HTTP behaviour is validated separately by `scripts/validate-routing.mjs`
 * against a running server. What is checked here is the source-level shape
 * that makes that behaviour possible, and which is easy to break silently.
 */
describe("base path", () => {
  const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");

  it("agrees between next.config.ts and the URL builders", () => {
    expect(config).toContain(`export const MAGAZINE_BASE_PATH = "${BASE_PATH}"`);
    expect(config).toContain("basePath: MAGAZINE_BASE_PATH");
  });

  it("is not accompanied by an assetPrefix", () => {
    // basePath already namespaces `_next`. A second prefix produces asset URLs
    // that are prefixed twice and 404, and is the most common way this
    // arrangement is broken.
    expect(config).not.toMatch(/^\s*assetPrefix:/m);
  });

  it("has no route directory matching the base path, which would double-prefix", () => {
    // A route at src/app/magazine/x/page.tsx publishes at /magazine/magazine/x,
    // because basePath is applied on top of the route tree rather than being
    // part of it. This looks like a routing bug and is a layout mistake.
    const appDir = join(process.cwd(), "src", "app");
    const entries = readdirSync(appDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(entries).not.toContain(BASE_PATH.replace("/", ""));
  });

  it("serves every machine-readable artifact from a route handler, not public/", () => {
    // basePath does not rewrite `public/`, so a feed placed there would be
    // served from the host root — outside the namespace the proxy routes — and
    // would 404 in production while working locally.
    for (const name of ["rss.xml", "atom.xml", "feed.json", "latest.json", "search-index.json", "sitemap.xml"]) {
      const handler = join(process.cwd(), "src", "app", name, "route.ts");
      expect(() => readFileSync(handler, "utf8"), `${name} must be a route handler`).not.toThrow();
    }
  });
});
