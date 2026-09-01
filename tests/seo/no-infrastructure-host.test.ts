import { describe, expect, it } from "vitest";

import { isInfrastructureHost } from "@/lib/env";
import { assertNoInfrastructureHost, BASE_PATH, magazineUrl, mainSiteUrl } from "@/lib/site";

/**
 * The infrastructure-hostname guard.
 *
 * This is the single most consequential SEO rule in the project: a canonical
 * URL, feed link or Open Graph URL that names a hosting provider's hostname
 * teaches search engines the wrong identity for the publication, and the
 * mistake is invisible on the deployment where it happens.
 */
describe("infrastructure hostnames", () => {
  it.each([
    "logisticid-magazine.vercel.app",
    "logisticid-magazine-git-main-x.vercel.app",
    "startling-twilight-3a0788.netlify.app",
    "preview.netlify.live",
    "something.pages.dev",
  ])("recognises %s as infrastructure", (host) => {
    expect(isInfrastructureHost(host)).toBe(true);
  });

  it.each(["logisticid.com", "www.logisticid.com", "localhost"])(
    "does not treat %s as infrastructure",
    (host) => {
      expect(isInfrastructureHost(host)).toBe(false);
    },
  );

  it("refuses to emit a URL on an infrastructure hostname", () => {
    expect(() =>
      assertNoInfrastructureHost(new URL("https://logisticid-magazine.vercel.app/magazine")),
    ).toThrow(/infrastructure hostname/);
  });
});

describe("URL construction", () => {
  it("puts every Magazine URL under the base path", () => {
    expect(magazineUrl("/road-freight/x").pathname).toBe(`${BASE_PATH}/road-freight/x`);
    expect(magazineUrl("/").pathname).toBe(BASE_PATH);
  });

  it("refuses a path that already carries the base path, so prefixes cannot double", () => {
    expect(() => magazineUrl("/magazine/road-freight")).toThrow(/must not already include/);
  });

  it("refuses a path that is not rooted", () => {
    expect(() => magazineUrl("road-freight")).toThrow(/must start with/);
  });

  it("keeps main-site links outside the base path", () => {
    expect(mainSiteUrl("/road-freight/ftl").pathname).toBe("/road-freight/ftl");
  });
});
