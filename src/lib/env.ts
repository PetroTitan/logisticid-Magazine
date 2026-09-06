/**
 * Typed access to environment configuration.
 *
 * The Magazine has exactly one piece of environment configuration that matters
 * to correctness: the canonical public origin it publishes itself under. It is
 * read here, validated here, and nowhere else.
 */

const DEFAULT_ORIGIN = "http://localhost:3000";

/**
 * Hostnames that belong to a hosting provider rather than to LogisticID.
 *
 * A deployment always has one of these, and it always works, which is exactly
 * what makes it dangerous: if it reaches a canonical tag, a feed, a sitemap or
 * an Open Graph URL, search engines learn the infrastructure hostname as the
 * real identity of the Magazine and the mistake is expensive to reverse.
 *
 * These suffixes are refused as a canonical origin outright. The check is on
 * the suffix, so it holds for every project, branch and preview hostname the
 * providers generate.
 */
const INFRASTRUCTURE_HOST_SUFFIXES = [
  ".vercel.app",
  ".netlify.app",
  ".netlify.live",
  ".pages.dev",
  ".onrender.com",
  ".fly.dev",
  ".herokuapp.com",
  // Added for the Railway migration. Railway issues `*.up.railway.app` to
  // every service and offers it before any custom domain exists, so it is the
  // hostname a deployment is tested on — which is exactly when a canonical
  // built from it would look correct. `.railway.app` covers the shorter form.
  ".up.railway.app",
  ".railway.app",
  // Railway's private network. Reaching a canonical is implausible, but this
  // application refuses to emit a public URL it does not own, and an internal
  // DNS name is the clearest possible case of that.
  ".railway.internal",
] as const;

/**
 * True when the given hostname belongs to a hosting provider.
 *
 * Exported because the same rule is applied to every absolute URL the Magazine
 * emits, not only to the configured origin — see `assertNoInfrastructureHost`.
 */
export function isInfrastructureHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  return INFRASTRUCTURE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/**
 * True when the canonical public origin has been configured.
 *
 * `robots.ts` uses this to withhold indexing from any deployment that does not
 * know its own canonical origin.
 */
export function hasConfiguredOrigin(): boolean {
  const raw = process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim();
  return raw !== undefined && raw !== "";
}

/**
 * True on a real production deployment, as opposed to a local or CI build.
 *
 * `NODE_ENV` is "production" during every `next build`, so it cannot make this
 * distinction. Netlify sets `CONTEXT`, Vercel sets `VERCEL_ENV`, and Railway
 * sets `RAILWAY_ENVIRONMENT_NAME`. All three are checked so the guard cannot
 * be disabled by changing host.
 */
export function isProductionDeployment(): boolean {
  return (
    process.env.CONTEXT === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.RAILWAY_ENVIRONMENT_NAME === "production"
  );
}

/**
 * The canonical public origin of the LogisticID website that serves the
 * Magazine — for example `https://logisticid.com`.
 *
 * This is deliberately the MAIN site's origin. The Magazine is published under
 * a path of that host, so its own infrastructure hostname is never its public
 * identity and must never appear in a canonical URL.
 *
 * Falls back to localhost so that local development and CI work without
 * configuration. On a production deployment the fallback is refused: shipping
 * canonicals that point at localhost is worse than a failed build, because it
 * is silent and search engines act on it.
 */
export function getSiteOrigin(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim();

  if (raw === undefined || raw === "") {
    if (isProductionDeployment()) {
      throw new Error(
        "NEXT_PUBLIC_SITE_ORIGIN must be set on a production deployment. " +
          "Without it, canonical URLs, the feeds and the sitemap would point at localhost.",
      );
    }
    return new URL(DEFAULT_ORIGIN);
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_ORIGIN is not a valid absolute URL: ${JSON.stringify(raw)}`,
    );
  }

  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new Error(
      `NEXT_PUBLIC_SITE_ORIGIN must use https (got ${parsed.protocol}//${parsed.hostname}).`,
    );
  }

  if (isInfrastructureHost(parsed.hostname)) {
    throw new Error(
      `NEXT_PUBLIC_SITE_ORIGIN is set to the infrastructure hostname ${parsed.hostname}. ` +
        "That hostname is deployment plumbing, not the public identity of LogisticID Magazine. " +
        "Set it to the canonical LogisticID origin instead.",
    );
  }

  if (parsed.pathname !== "/" || parsed.search !== "" || parsed.hash !== "") {
    throw new Error(
      "NEXT_PUBLIC_SITE_ORIGIN must be a bare origin with no path, query or fragment " +
        `(got ${raw}).`,
    );
  }

  return parsed;
}
