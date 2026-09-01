import { getSiteOrigin, isInfrastructureHost } from "@/lib/env";

/**
 * The public path prefix the Magazine is served under on the LogisticID host.
 *
 * This duplicates `basePath` in next.config.ts by necessity: `next.config.ts`
 * is not importable from the application graph, and the value is needed to
 * build absolute URLs. `tests/routing/base-path.test.ts` asserts the two agree,
 * so they cannot drift silently.
 */
export const BASE_PATH = "/magazine";

export const site = {
  /** The publication's own name. */
  name: "LogisticID Magazine",
  /** The parent brand. The Magazine is part of LogisticID, not a second brand. */
  parentName: "LogisticID",
  /**
   * What the publication is, in one line.
   *
   * Descriptive only — it makes no claim about scale, readership, authority or
   * ranking, none of which is measured.
   */
  tagline:
    "European road freight insight, practical shipping guidance and logistics intelligence from LogisticID.",
  /** Language of the publication, as a BCP 47 tag. */
  locale: "en",
} as const;

/**
 * Refuse any absolute URL that points at a hosting provider's hostname.
 *
 * Called on every absolute URL the Magazine emits — canonical tags, Open Graph
 * URLs, feed links, sitemap entries and JSON-LD. A single leak is enough to
 * teach a search engine the wrong identity for the publication, and the leak
 * is invisible on the deployment where it happens, because there the
 * infrastructure hostname is the hostname that works.
 */
export function assertNoInfrastructureHost(url: URL): URL {
  if (isInfrastructureHost(url.hostname)) {
    throw new Error(
      `Refusing to emit ${url.href}: ${url.hostname} is an infrastructure hostname, ` +
        "not the public identity of LogisticID Magazine.",
    );
  }
  return url;
}

/**
 * Build an absolute public URL for a Magazine path.
 *
 * `path` is given WITHOUT the `/magazine` prefix — the prefix is this
 * function's job, exactly as it is `basePath`'s job for the routes themselves.
 * Passing "/road-freight/x" yields "https://logisticid.com/magazine/road-freight/x".
 *
 * Every absolute URL in the Magazine's output goes through here, which is what
 * makes the infrastructure-host guard total rather than best-effort.
 */
export function magazineUrl(path = "/"): URL {
  if (!path.startsWith("/")) {
    throw new Error(`Magazine path must start with "/" (got ${JSON.stringify(path)}).`);
  }
  if (path.startsWith(`${BASE_PATH}/`) || path === BASE_PATH) {
    throw new Error(
      `Magazine path must not already include the "${BASE_PATH}" prefix (got ${path}). ` +
        "The prefix is added here, and adding it twice is how these URLs get doubled.",
    );
  }

  const origin = getSiteOrigin();
  const suffix = path === "/" ? "" : path;
  return assertNoInfrastructureHost(new URL(`${BASE_PATH}${suffix}`, origin));
}

/**
 * Build an absolute URL for a page on the MAIN LogisticID site.
 *
 * Used for the route back out of the Magazine and for links to the services
 * and pages an article relates to.
 */
export function mainSiteUrl(path = "/"): URL {
  if (!path.startsWith("/")) {
    throw new Error(`Main site path must start with "/" (got ${JSON.stringify(path)}).`);
  }
  return assertNoInfrastructureHost(new URL(path, getSiteOrigin()));
}
