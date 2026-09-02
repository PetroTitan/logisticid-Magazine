#!/usr/bin/env node
/**
 * Generates the exact main-repository integration change — but only for a
 * hostname it has just proved works.
 *
 * The point is to make a placeholder impossible. A rewrite whose destination
 * was typed from memory, or left as `<MAGAZINE-HOST>`, deploys perfectly
 * cleanly and 404s every article on the live commercial site: Netlify does not
 * validate a proxy destination at deploy time. So this script refuses to print
 * anything until the hostname has answered correctly to every check below.
 *
 * Usage:
 *   node scripts/print-integration-diff.mjs <magazine-host>
 *   node scripts/print-integration-diff.mjs logisticid-magazine.netlify.app
 */

const HOST = process.argv[2];
const MAIN_ORIGIN = "https://logisticid.com";

if (HOST === undefined || HOST === "") {
  console.error("Usage: node scripts/print-integration-diff.mjs <magazine-host>");
  process.exit(2);
}

if (/[<>{}]|EXAMPLE|PLACEHOLDER|VERIFIED|YOUR-/i.test(HOST)) {
  console.error(`Refusing to generate a diff for a placeholder hostname: ${HOST}`);
  process.exit(2);
}

if (HOST.includes("/") || HOST.includes(":")) {
  console.error(`Pass a bare hostname, not a URL: ${HOST}`);
  process.exit(2);
}

const base = `https://${HOST}`;
const failures = [];

async function probe(path, expect, describe) {
  let response;
  try {
    response = await fetch(`${base}${path}`, { redirect: "manual" });
  } catch (error) {
    failures.push(`${path}: request failed (${error.message})`);
    return undefined;
  }
  if (response.status !== expect) {
    failures.push(`${path}: ${response.status}, expected ${expect} — ${describe}`);
  }
  return response;
}

console.log(`Verifying https://${HOST} before generating anything...\n`);

// 1. The Magazine must actually be there, under its base path.
const home = await probe("/magazine", 200, "the Magazine home page must be served");
await probe("/magazine/road-freight", 200, "section pages must be served");
await probe("/magazine/sitemap.xml", 200, "the sitemap route handler must be served");

// 2. It must claim nothing outside its namespace, or it would fight the main
//    application for paths the proxy never routes to it.
await probe("/", 404, "the Magazine must not answer at the host root");
await probe("/_next/static/chunks/main.js", 404, "the Magazine must not own the root asset namespace");

// 3. Unknown Magazine paths must be genuine 404s, not a 200 fallback.
await probe("/magazine/this-page-does-not-exist", 404, "unknown paths must 404");

// 4. Assets must resolve, and must be namespaced.
if (home !== undefined && home.status === 200) {
  const html = await home.text();

  const assets = [...html.matchAll(/(?:href|src)="(\/[^"]*_next[^"]*)"/g)].map((m) => m[1]);
  if (assets.length === 0) failures.push("the home page references no _next assets at all");
  for (const asset of assets) {
    if (!asset.startsWith("/magazine/_next/")) {
      failures.push(`asset ${asset} is outside /magazine and would collide with the main site`);
    }
  }
  const [first] = assets;
  if (first !== undefined) {
    await probe(first, 200, "assets must actually load");
  }

  // 5. The canonical must already name the MAIN host. If it names this one,
  //    the deployment is misconfigured and proxying it would publish the
  //    infrastructure hostname as the Magazine's identity.
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
  if (canonical !== `${MAIN_ORIGIN}/magazine`) {
    failures.push(`home canonical is ${canonical}, expected ${MAIN_ORIGIN}/magazine`);
  }
  if (/netlify\.app|vercel\.app/.test(html)) {
    failures.push("the home page leaks an infrastructure hostname into its body");
  }
}

if (failures.length > 0) {
  console.error(`NOT READY — ${failures.length} check(s) failed:\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error("\nNo diff generated. Fix the Magazine deployment first.");
  process.exit(1);
}

console.log(`All checks passed against ${HOST}.\n`);
console.log("Apply the following to PetroTitan/logisticid on branch feat/magazine-integration.\n");
console.log("─".repeat(72));
console.log(`
# 1/3 — netlify.toml : append this block
#
# status = 200 makes this a rewrite, not a redirect: the address bar keeps
# showing logisticid.com/magazine/... while Netlify fetches the response from
# the Magazine site. A 3xx here would make the Magazine's own hostname the
# public identity of the publication.
#
# The destination repeats /magazine because the Magazine app is served under
# basePath "/magazine"; :splat carries only the remainder. It must cover the
# whole subtree, including /magazine/_next/*, or the pages render unstyled.
#
# Verified against ${HOST} on ${new Date().toISOString().slice(0, 10)}.

[[redirects]]
  from = "/magazine/*"
  to = "https://${HOST}/magazine/:splat"
  status = 200
  force = true


# 2/3 — the site header : one link, no redesign
#
# A plain <a>, not next/link: /magazine is not in the main application's route
# tree, and client-navigating to a path it has no build output for produces a
# client-side 404 on a URL that works fine on a hard refresh.

  <a className="site-nav__link" href="/magazine">Magazine</a>


# 3/3 — robots.txt : advertise the second sitemap
#
# Two Sitemap: lines rather than a sitemap index, so publishing a Magazine
# article never requires the main application to rebuild.

  Sitemap: ${MAIN_ORIGIN}/sitemap.xml
  Sitemap: ${MAIN_ORIGIN}/magazine/sitemap.xml
`);
console.log("─".repeat(72));
console.log(`
After deploying the main site, verify:

  curl -sI ${MAIN_ORIGIN}/magazine | head -1                      # 200
  curl -s  ${MAIN_ORIGIN}/magazine | grep -o 'canonical[^>]*'     # ${MAIN_ORIGIN}/magazine
  curl -sI ${MAIN_ORIGIN}/magazine/does-not-exist | head -1       # 404
  curl -sI ${MAIN_ORIGIN}/ | head -1                              # 200, main app
  curl -s  ${MAIN_ORIGIN}/magazine | grep -c 'netlify.app'        # 0

Then confirm the article renders STYLED in a browser. If it does not, the
rewrite is not covering /magazine/_next/*.
`);
