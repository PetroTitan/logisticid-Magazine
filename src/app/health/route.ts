import { readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Readiness probe for the platform, and nothing else.
 *
 * WHAT RAILWAY DOES WITH THIS. A healthcheck path is polled after a new
 * deployment starts and before traffic moves to it; the previous deployment
 * keeps serving until this returns 2xx. So a deployment that cannot serve must
 * fail here, or the platform will happily replace a working site with a broken
 * one. Railway sends these requests with the `Host: healthcheck.railway.app`
 * header, which this application does not filter on.
 *
 * WHY IT DOES MORE THAN `return new Response("ok")`.
 *
 * The failure this migration actually risks is not a dead process. It is a
 * live one serving a build with no static assets: `output: "standalone"` does
 * not copy `public/` or `.next/static` next to the server, so if
 * `scripts/prepare-standalone.mjs` did not run, every page still returns 200
 * and renders HTML while every stylesheet, script and photograph 404s. A
 * trivial health endpoint reports that deployment as healthy, and Railway
 * promotes it.
 *
 * So this checks the one thing that distinguishes the two states: that the
 * static chunk directory the browser is about to ask for exists and is not
 * empty. It is a directory listing — no database, no network, no secret, no
 * user data, and nothing that changes between requests.
 *
 * WHAT IT DELIBERATELY DOES NOT REPORT. No environment variables, no commit
 * SHA, no deployment id, no configuration, no dependency status, no version.
 * A health endpoint is a public URL; everything it prints is published. The
 * body is two fixed words.
 *
 * MAGAZINE NOTE — THE PATH IS `/magazine/health`, NOT `/health`.
 * This application has `basePath: "/magazine"`, which prefixes every route it
 * emits, this one included. Railway's healthcheck path for the Magazine
 * service must therefore be set to `/magazine/health`; `/health` will 404 and
 * every deployment will fail its probe. This is the single most likely way to
 * misconfigure this service, so it is written where somebody changing the file
 * will read it.
 */

export const dynamic = "force-dynamic";

/**
 * Where the browser will look for chunks, resolved the same way the running
 * server resolves it.
 *
 * Under `output: "standalone"` the server's working directory is
 * `.next/standalone`, so `.next/static` beneath it is the copy that
 * `prepare-standalone.mjs` made. Under `next start` it is the build's own
 * `.next/static`. The same relative path is correct in both, which is what
 * makes this check meaningful in development as well as on Railway.
 */
const STATIC_DIR = join(process.cwd(), ".next", "static");

export async function GET(): Promise<Response> {
  let staticAssetsPresent = false;
  try {
    staticAssetsPresent = (await readdir(STATIC_DIR)).length > 0;
  } catch {
    staticAssetsPresent = false;
  }

  if (!staticAssetsPresent) {
    return new Response("unready\n", {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        // A failed probe must never be cached by the platform CDN, or a
        // recovered deployment keeps reporting the failure.
        "x-robots-tag": "noindex, nofollow",
      },
    });
  }

  return new Response("ready\n", {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      // Not content. It has no place in an index, and it is excluded from the
      // sitemap and from `publicRoutes` for the same reason.
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
