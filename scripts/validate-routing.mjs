#!/usr/bin/env node
/**
 * Routing validation.
 *
 * Boots the production server and makes real HTTP requests. This is
 * deliberately not a unit test: the properties that matter here — that assets
 * resolve under `/magazine/_next`, that an unknown path returns a genuine 404
 * rather than a 200 fallback, that the application claims nothing at the host
 * root, that no response names an infrastructure hostname — are properties of
 * the served responses, and a unit test asserting the intent behind them would
 * pass on a build where all four were broken.
 *
 * Usage: node scripts/validate-routing.mjs [--port 4399]
 */
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = Number(process.argv.includes("--port")
  ? process.argv[process.argv.indexOf("--port") + 1]
  : 4399);
const BASE = `http://127.0.0.1:${PORT}`;
const ORIGIN = "https://logisticid.com";

/** Paths that must return 200, with the content type they must return. */
const MUST_SERVE = [
  ["/magazine", "text/html"],
  ["/magazine/road-freight", "text/html"],
  ["/magazine/shipping-guides", "text/html"],
  ["/magazine/authors", "text/html"],
  ["/magazine/authors/logisticid-editorial-team", "text/html"],
  ["/magazine/search", "text/html"],
  ["/magazine/editorial-policy", "text/html"],
  ["/magazine/sourcing-policy", "text/html"],
  ["/magazine/image-policy", "text/html"],
  ["/magazine/corrections", "text/html"],
  ["/magazine/rss.xml", "application/rss+xml"],
  ["/magazine/atom.xml", "application/atom+xml"],
  ["/magazine/feed.json", "application/feed+json"],
  ["/magazine/latest.json", "application/json"],
  ["/magazine/search-index.json", "application/json"],
  ["/magazine/sitemap.xml", "application/xml"],

  /*
   * The German edition. Every English surface above has its counterpart here,
   * because a German route that exists only in the route table is a route
   * nothing has ever asked the server for.
   */
  ["/magazine/de", "text/html"],
  ["/magazine/de/road-freight", "text/html"],
  ["/magazine/de/shipping-guides", "text/html"],
  ["/magazine/de/logisticid", "text/html"],
  ["/magazine/de/autoren", "text/html"],
  ["/magazine/de/autoren/logisticid-editorial-team", "text/html"],
  ["/magazine/de/suche", "text/html"],
  ["/magazine/de/redaktionsrichtlinien", "text/html"],
  ["/magazine/de/quellenrichtlinien", "text/html"],
  ["/magazine/de/bild-und-ki-richtlinien", "text/html"],
  ["/magazine/de/korrekturen", "text/html"],
  ["/magazine/de/rss.xml", "application/rss+xml"],
  ["/magazine/de/atom.xml", "application/atom+xml"],
  ["/magazine/de/feed.json", "application/feed+json"],
  ["/magazine/de/latest.json", "application/json"],
  ["/magazine/de/search-index.json", "application/json"],
];

/**
 * Paths that must return 404.
 *
 * The last three matter most: they prove the Magazine claims nothing outside
 * its own namespace, which is what makes it safe to place behind a proxy on a
 * host another application already owns.
 */
const MUST_404 = [
  "/magazine/this-page-does-not-exist",
  "/magazine/road-freight/no-such-article",
  "/magazine/authors/nobody",
  "/",
  "/road-freight",
  "/_next/static/chunks/main.js",

  /* A German URL that does not exist answers 404, not the German index. */
  "/magazine/de/not-real",
  "/magazine/de/road-freight/kein-solcher-beitrag",
  "/magazine/de/autoren/niemand",

  /*
   * NO ENGLISH FALLBACK UNDER A GERMAN PATH. This is the whole reason the
   * application is split into `(en)` and `(de)` route groups with
   * `dynamicParams = false` on both: an English slug under `/de/` must be a
   * real 404, because serving the English article there with a 200 would
   * publish every article twice under two URLs in two languages and ask a
   * search engine to pick.
   */
  "/magazine/de/road-freight/ftl-ltl-express-and-pallet-freight-explained",
  "/magazine/de/logisticid/welcome-to-logisticid-magazine",
  "/magazine/de/editorial-policy",
  "/magazine/de/authors",

  /* And no German slug under an English path, for the same reason. */
  "/magazine/road-freight/ftl-ltl-express-palettenversand-unterschiede",
  "/magazine/redaktionsrichtlinien",

  /* `/de/magazine/*` is forbidden by the routing contract and owned by nobody. */
  "/de/magazine",
  "/de/magazine/road-freight",
];

const failures = [];
const notes = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function main() {
  // The build and the probe MUST share one environment.
  //
  // A build picks up the canonical origin and the preview-noindex decision at
  // build time and bakes both into the static HTML. Building with one set of
  // variables and serving with another produced a validator that reported
  // dozens of failures against a build that was never the one being tested —
  // localhost canonicals in the HTML, production headers on the responses. So
  // this script performs its own build rather than trusting whatever `.next`
  // happens to be on disk.
  const env = { ...process.env, NEXT_PUBLIC_SITE_ORIGIN: ORIGIN, CONTEXT: "production" };

  // Refuse to run against a server this script did not start. A leftover
  // server from an earlier run answers on the same port and every probe
  // passes — against a build that may be several changes old. A validator
  // that can silently grade the wrong artifact is worse than none.
  try {
    const stray = await fetch(`${BASE}/magazine`, { signal: AbortSignal.timeout(1500) });
    if (stray.ok) {
      console.error(
        `validate:routing FAILED: something is already listening on port ${PORT}.\n` +
          `  Stop it first (lsof -ti tcp:${PORT} | xargs kill -9), or pass --port <free port>.`,
      );
      process.exit(1);
    }
  } catch {
    /* Nothing listening, which is what we want. */
  }

  console.log("  building with NEXT_PUBLIC_SITE_ORIGIN=" + ORIGIN + " CONTEXT=production ...");
  const build = spawnSync("npx", ["next", "build"], { env, stdio: "inherit" });
  if (build.status !== 0) {
    console.error("validate:routing FAILED: the production build did not succeed.");
    process.exit(1);
  }

  // `detached: true` puts the server in its own process group.
  //
  // Without it, `server.kill()` kills the `npx` wrapper and leaves the actual
  // `next start` process holding the port. The next run then finds the port
  // occupied — and, before the guard above existed, silently validated that
  // stale server instead of a fresh build. Killing the negated PID signals the
  // whole group, wrapper and server together.
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  try {
    // Wait for the server to answer rather than sleeping a fixed amount.
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        const response = await fetch(`${BASE}/magazine`);
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {
        /* not up yet */
      }
      await sleep(500);
    }
    if (!ready) throw new Error(`server did not become ready on ${BASE}`);

    for (const [path, contentType] of MUST_SERVE) {
      const response = await fetch(`${BASE}${path}`);
      check(response.status === 200, `${path} returned ${response.status}, expected 200`);
      const actual = response.headers.get("content-type") ?? "";
      check(
        actual.includes(contentType),
        `${path} returned content-type "${actual}", expected ${contentType}`,
      );

      const body = await response.text();
      check(
        !/vercel\.app|netlify\.app|pages\.dev|127\.0\.0\.1|localhost/.test(body),
        `${path} leaks an infrastructure hostname into its body`,
      );
      check(
        response.headers.get("x-content-type-options") === "nosniff",
        `${path} is missing the X-Content-Type-Options header`,
      );
      // A production deployment must not carry a site-wide noindex.
      check(
        response.headers.get("x-robots-tag") === null,
        `${path} carries X-Robots-Tag on a production build`,
      );
    }

    for (const path of MUST_404) {
      const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
      check(
        response.status === 404,
        `${path} returned ${response.status}, expected a genuine 404`,
      );
    }

    // Assets must resolve under the base path, and be reachable.
    const html = await (await fetch(`${BASE}/magazine`)).text();
    const assets = [...html.matchAll(/(?:href|src)="(\/[^"]*_next[^"]*)"/g)].map((m) => m[1]);
    check(assets.length > 0, "the home page references no _next assets at all");
    for (const asset of assets) {
      check(
        asset.startsWith("/magazine/_next/"),
        `asset ${asset} is outside the /magazine namespace and would collide with the main site`,
      );
    }
    const [firstAsset] = assets;
    if (firstAsset !== undefined) {
      const assetResponse = await fetch(`${BASE}${firstAsset}`);
      check(assetResponse.status === 200, `asset ${firstAsset} returned ${assetResponse.status}`);
    }
    notes.push(`${assets.length} asset references checked, all under /magazine/_next/`);

    // Canonicals must name the main LogisticID host, under /magazine.
    const article = await (
      await fetch(`${BASE}/magazine/road-freight/ftl-ltl-express-and-pallet-freight-explained`)
    ).text();
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(article)?.[1];
    check(
      canonical === `${ORIGIN}/magazine/road-freight/ftl-ltl-express-and-pallet-freight-explained`,
      `article canonical was ${canonical}`,
    );
    check((article.match(/<h1/g) ?? []).length === 1, "the article page does not have exactly one h1");

    // The search page must be noindex, follow.
    const search = await (await fetch(`${BASE}/magazine/search`)).text();
    check(
      /<meta name="robots" content="noindex, follow"\/?>/.test(search),
      "the search page is not noindex, follow",
    );

    // The sitemap must not advertise the noindexed search page.
    const sitemap = await (await fetch(`${BASE}/magazine/sitemap.xml`)).text();
    check(!sitemap.includes("/magazine/search"), "the sitemap lists the noindexed search page");
  } finally {
    if (server.pid !== undefined) {
      try {
        process.kill(-server.pid, "SIGKILL");
      } catch {
        // Already gone; nothing to clean up.
      }
    }
  }

  for (const note of notes) console.log(`  ${note}`);

  if (failures.length > 0) {
    console.error(`\nvalidate:routing FAILED (${failures.length}):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log(
    `\nvalidate:routing passed: ${MUST_SERVE.length} served routes, ${MUST_404.length} genuine 404s.`,
  );
}

await main();
