import type { NextConfig } from "next";

/**
 * LogisticID Magazine — build and routing configuration.
 *
 * ## Why `basePath`
 *
 * The Magazine is a separate application that is served to the public under
 * `https://logisticid.com/magazine/*`. The main LogisticID site already owns
 * `/_next/*` on that host, so the Magazine must not ask for that namespace:
 * two applications answering the same asset path is an ambiguity no proxy can
 * resolve correctly.
 *
 * `basePath: "/magazine"` moves every route AND every framework asset the
 * application emits under `/magazine`, so its static chunks are requested from
 * `/magazine/_next/static/*`. That is a path the main site never serves, which
 * is what makes the two applications co-existable on one hostname.
 *
 * ## The two traps this configuration deliberately avoids
 *
 * 1. **Do not also create `src/app/magazine/`.** `basePath` is a prefix applied
 *    on top of the route tree, so a route file at `src/app/magazine/x/page.tsx`
 *    is published at `/magazine/magazine/x`. Routes live at the app root.
 *
 * 2. **Do not set `assetPrefix`.** `basePath` already namespaces `_next`.
 *    Adding a second prefix produces asset URLs that are prefixed twice and
 *    404, and it is the most common way this arrangement is broken.
 *
 * ## `public/` is not covered
 *
 * A `basePath` does not rewrite files served from `public/`. Every
 * machine-readable artifact the Magazine publishes (feeds, sitemap, search
 * index) is therefore a **route handler**, not a static file — route handlers
 * are part of the route tree and so are prefixed correctly, and they can set
 * their own cache and content-type headers.
 */

export const MAGAZINE_BASE_PATH = "/magazine";

/**
 * Baseline security headers.
 *
 * These intentionally mirror the main LogisticID site's headers so that a
 * visitor crossing the `/magazine` boundary on one hostname does not silently
 * move between two different security postures. HSTS is owned by the main
 * host and is not set here: the Magazine never answers on the apex directly,
 * and a second HSTS policy on the same host would be either redundant or
 * contradictory.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

/**
 * True only on a real production deployment of the Magazine.
 *
 * `NODE_ENV` is "production" for every `next build`, including local ones, so
 * it cannot make this distinction. Netlify sets `CONTEXT`, Vercel sets
 * `VERCEL_ENV`; both are read so that the guard cannot be silently disabled by
 * changing host.
 */
function isProductionDeployment(): boolean {
  return (
    process.env.CONTEXT === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

const nextConfig: NextConfig = {
  basePath: MAGAZINE_BASE_PATH,

  // The framework name is not something to advertise on every response.
  poweredByHeader: false,

  async headers() {
    // `/:path*` rather than `/(.*)`: measured on Next.js 16.3.0 under this
    // basePath, `/(.*)` matches every route EXCEPT the index, so the Magazine
    // home page came back with no security headers at all while every other
    // page had them. `/:path*` matches the root as a zero-segment path.
    const headers = [{ source: "/:path*", headers: securityHeaders }];

    // Any deployment that is not production — a preview, a branch build, or
    // the infrastructure hostname before a domain is attached — must not be
    // indexable. It serves the same editorial content as production and would
    // otherwise compete with it. This is a response header rather than a meta
    // tag so that it also covers the feeds, the sitemap and the search index,
    // which have no HTML head to put a meta tag in.
    if (!isProductionDeployment()) {
      headers.push({
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      });
    }

    return headers;
  },
};

export default nextConfig;
