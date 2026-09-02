# Same-host routing architecture for LogisticID Magazine

**Status:** Decided; **not deployed.** Deployment is blocked on credentials, not on architecture — see §9.
**Date:** 2026-09-01
**Supersedes:** the premise in the commissioning brief that LogisticID runs on Vercel.

---

## 1. The requirement

Publicly, one hostname:

```
https://logisticid.com/*            → main LogisticID application
https://logisticid.com/magazine/*   → LogisticID Magazine
```

Operationally, two applications, two repositories, two builds, two deploy histories. A Magazine article must not rebuild the main site; an unrelated main-site change must not rebuild the Magazine.

`https://logisticid.com/magazine/road-freight/…` must stay visibly on that URL. A 301/302/307/308 to an infrastructure hostname is unacceptable.

---

## 2. Official documentation consulted

| Source | URL | Accessed |
| --- | --- | --- |
| Netlify — Rewrites and proxies | `https://docs.netlify.com/routing/redirects/rewrites-proxies/` | 2026-09-01 |
| Vercel — Microfrontends: path routing | `https://vercel.com/docs/microfrontends/path-routing` | 2026-09-01 |
| Vercel — Microfrontends (overview, quickstart) | `https://vercel.com/docs/microfrontends` | 2026-09-01 |
| Vercel — Serving multiple projects under a single domain | `https://vercel.com/kb/guide/how-can-i-serve-multiple-projects-under-a-single-domain` | 2026-09-01 |

Measured behaviour cited below (base path, assets, 404s, headers) comes from a real production build of this application served over HTTP on 2026-09-01, not from documentation.

---

## 3. The premise that had to be corrected first

The brief asks for Vercel Multi-Zones or Vercel Microfrontends, routing from "the existing LogisticID Vercel project".

**That project does not exist.** `logisticid.com` is served by **Netlify** (`server: Netlify`, `x-nf-request-id`, `www` → `startling-twilight-3a0788.netlify.app`), the repository's `docs/PRODUCTION-DEPLOYMENT.md` states Netlify as the host, and `netlify.toml` at the repository root is documented as authoritative. The Vercel team `petrotitans-projects` contains only `builddesignhub-com` and `faunahub-com`.

Vercel's documentation is explicit that Microfrontends maps paths **to Vercel projects**, with a default app that owns `microfrontends.json` and handles the domain. That mechanism operates inside Vercel's CDN for a domain a Vercel project serves. `logisticid.com` is not such a domain.

**Vercel Microfrontends is therefore inapplicable here** — not rejected on preference. Using it would require migrating the main production site from Netlify to Vercel, which is a far larger and riskier change than publishing a magazine, and is out of scope.

---

## 4. Options evaluated

### 4.1 DNS

Cannot route by path. DNS resolves a hostname to an address and has no visibility of `/magazine`. Recorded only because it is a common proposal.

**Rejected: technically impossible.**

### 4.2 A `/magazine` directory in the main repository

Simple, and it genuinely works. But it couples Magazine publishing to the main build: every correction rebuilds and redeploys the commercial site, and a content error can fail the main deployment.

**Rejected: it is the requirement's inverse.** Worth noting honestly that if the independence requirement were ever dropped, this option is materially simpler than everything below and every other invariant holds for free.

### 4.3 Vercel Microfrontends / Multi-Zones

**Inapplicable** — §3.

### 4.4 A redirect from the main site to a Magazine hostname

Trivial, and defeats the purpose: the reader's address bar shows the Magazine hostname, the Magazine becomes a second public identity, and canonical URLs fragment across two hosts.

**Rejected: the brief forbids it, correctly.**

### 4.5 Netlify proxy rewrite — **SELECTED**

Netlify's documentation: assigning HTTP status `200` to a redirect rule makes it a **rewrite** — *"the URL in the visitor's address bar remains unchanged while Netlify's servers fetch the new location behind the scenes."* Site-to-site proxying is documented as a supported and recommended form.

In the main repository's `netlify.toml`:

```toml
[[redirects]]
  from = "/magazine"
  to = "https://<magazine-site>.netlify.app/magazine"
  status = 200
  force = true

[[redirects]]
  from = "/magazine/*"
  to = "https://<magazine-site>.netlify.app/magazine/:splat"
  status = 200
  force = true
```

The exact rule must precede the wildcard. An empty wildcard requests `/magazine/` upstream; Next.js normalizes that path to `/magazine`, which otherwise re-enters the same public rewrite and loops with HTTP 308. The subtree destination repeats `/magazine` because the Magazine application is itself served under `basePath: "/magazine"` — `:splat` carries only the remainder.

**Why this is the right mechanism here:**

- The main site already owns `logisticid.com` on Netlify, so the rewrite happens where the domain is already terminated. No DNS change, no domain move, no second domain attachment.
- Netlify-to-Netlify proxying is documented as the recommended form, and same-team proxying is permitted. (Cross-team rewrites are explicitly **not** allowed, which is a constraint to respect when creating the Magazine site: **it must live in the same Netlify team.**)
- Independence is preserved exactly: two sites, two builds, two deploy histories, two rollbacks.

**Documented constraints, and how each is handled:**

| Constraint | Handling |
| --- | --- |
| 26-second proxy timeout | The Magazine is fully statically generated. No route does work; nothing approaches the limit. |
| One proxy hop between Netlify sites | One hop is used. Nothing is chained behind the Magazine. |
| Cross-team rewrites not allowed | The Magazine site must be created in the **same Netlify team** as the main site. Recorded as a deployment prerequisite. |
| Relative asset paths may break in proxied content | Solved by `basePath` — §5. Every asset URL is absolute from the host root and already namespaced. |
| Rewrites to password-protected sites not allowed | The Magazine site must not have Netlify password protection enabled. Preview noindex is achieved with a header instead — §7. |
| Proxied paths may not redirect HTTP→HTTPS as expected | Only `https://` URLs are published, and the canonical origin validator refuses a non-https origin outright. |
| Infinite loops are ignored | The Magazine site must not itself rewrite `/magazine/*` anywhere. |

### 4.6 Magazine on Vercel, proxied from Netlify

The same Netlify rewrite, pointing at a Vercel deployment instead. It works — external proxying is supported — but it splits the stack across two providers and two dashboards for no gain, adds a cross-provider network hop, and forfeits the same-team, single-hop guarantees of 4.5.

**Rejected** unless there is a reason to be on Vercel that this project does not have. This is the one place where the brief's stated preference and the evidence diverge, and it is flagged for the owner in §10.

---

## 5. Base path and asset namespace

**Decision: `basePath: "/magazine"`, no `assetPrefix`.**

The main application already owns `/_next/*` on `logisticid.com`. Two applications answering the same asset path is an ambiguity no proxy resolves correctly.

`basePath` moves routes **and framework assets** under `/magazine`, so chunks are requested from `/magazine/_next/static/*` — a path the main site never serves.

**Measured on this build (Next.js 16.3.0, production build, real HTTP):**

- 9 asset references on the home page, **all** under `/magazine/_next/`, all HTTP 200.
- `/`, `/road-freight` and `/_next/static/chunks/main.js` all return **404** from the Magazine server. The application claims nothing outside its namespace, which is precisely what makes it safe behind a proxy.
- `/magazine/this-page-does-not-exist` returns a **genuine 404**, not a 200 fallback.

### Three traps, all confirmed by measurement

1. **Do not create `src/app/magazine/`.** `basePath` is applied *on top of* the route tree, so a route there publishes at `/magazine/magazine/…`. Routes live at the app root. Asserted by `tests/routing/base-path.test.ts`.

2. **Do not set `assetPrefix`.** `basePath` already namespaces `_next`; a second prefix doubles asset URLs and 404s. Also asserted by test.

3. **`basePath` does not cover `public/`.** A feed placed there is served from the host root — outside the namespace the proxy routes — and 404s in production while working locally. **Every machine-readable artifact is therefore a route handler**: `rss.xml`, `atom.xml`, `feed.json`, `latest.json`, `search-index.json`, `sitemap.xml`. Verified serving with correct content types; asserted by test.

### A fourth trap, found here

Security headers configured as `source: "/(.*)"` — copied from the main site — match every route **except the index** under a `basePath`. The Magazine home page was served with no security headers at all while every other page had them. Invisible to typecheck, lint, and to any test asserting config intent; only an HTTP request revealed it. Fixed to `source: "/:path*"`, and `validate:routing` now asserts `X-Content-Type-Options` on every route.

---

## 6. RSC, prefetch and client navigation

Next.js App Router requests carry `RSC` and `Next-Router-*` headers and vary on them. The main site's own responses already show `Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch`.

Because the rewrite is a transparent proxy of the whole subtree — including `/magazine/_next/*` — RSC payload requests travel the same path as document requests and are answered by the Magazine. Nothing forwards to the main application.

Two deliberate design choices reduce what has to work:

- **Every Magazine page is statically generated.** There are no server actions, no route handlers doing work, no dynamic rendering.
- **Client navigation never crosses the boundary.** Links *within* the Magazine are `next/link` (prefixed by `basePath`). Links **out** to the main site — the header exit link, footer links, breadcrumb root, per-article service links — are plain `<a>` with absolute URLs, so the browser performs a full navigation and the App Router is never asked to route a path its own build does not contain.

**Unverified:** how the proxy interacts with RSC prefetch caching in production. It is a deployment observation, and no deployment was made. The static-only design is what keeps the risk low: the worst realistic failure is a prefetch miss, which costs a navigation its speed, not its correctness.

---

## 7. Preview protection

Preview and branch deployments serve the same editorial content as production and would compete with it.

Any build that is not production (`CONTEXT !== "production"` and `VERCEL_ENV !== "production"`) emits `X-Robots-Tag: noindex, nofollow` on **every** route. **Verified:** present on all routes in a preview build, absent in a production build.

A response header rather than a meta tag, deliberately: it also covers the feeds, sitemap and search index, which have no HTML head.

### The robots.txt gap, stated plainly

With `basePath: "/magazine"`, the application **cannot serve `/robots.txt` at its infrastructure host's root** — that path is outside its namespace, and it correctly 404s. So the Magazine's infrastructure hostname has **no robots.txt at all**.

The `X-Robots-Tag` header is therefore not a belt-and-braces measure; it is the *only* protection for the infrastructure host, and must not be removed. In production, `logisticid.com/robots.txt` is served by the main site and is the only robots.txt any crawler consults for the canonical host.

---

## 8. Canonicals, headers and caching

**Canonical URLs.** Built as absolute URLs through `magazineUrl()`, never relative. Under a `basePath` a relative canonical resolves against the origin and not the base path, so `/road-freight/x` would publish a canonical pointing at the **main site's** `/road-freight/x` — quietly telling search engines a Magazine article duplicates a service page.

Every absolute URL passes through a guard that refuses `*.vercel.app`, `*.netlify.app`, `*.netlify.live`, `*.pages.dev`, `*.onrender.com`, `*.fly.dev` and `*.herokuapp.com`. A production build without `NEXT_PUBLIC_SITE_ORIGIN` **fails** rather than shipping localhost canonicals. **Verified: zero infrastructure-hostname occurrences across all 16 served routes.**

**Headers.** The Magazine sets the same four security headers as the main site, so a reader crossing the boundary does not move between security postures. HSTS is not set — it belongs to the host, and the Magazine never answers on the apex directly.

**Caching.** HTML and hashed assets use the framework defaults; hashed assets are immutable by construction. Feeds, `latest.json` and `search-index.json` use `public, max-age=600, s-maxage=600, stale-while-revalidate=3600` — short enough that a new deployment propagates promptly, long enough that polling is cheap. Nothing is cached indefinitely; caching is not disabled globally.

**Cookies.** The Magazine sets none and requires none to display editorial content.

---

## 9. What is not proven

Stated explicitly because the brief asks for production evidence, and there is none:

1. **The rewrite has never been deployed.** Its documented behaviour is recorded above; its behaviour on this specific pair of sites is not observed.
2. **Deployment isolation is unproven in both directions.** It requires two live sites.
3. **Failure isolation is unproven.**
4. **No same-host request has ever been made**, because there is no Magazine deployment to route to.
5. **IndexNow does not exist** in the main repository — no key, no key file, no submission code. Nothing was invented, and no URL was submitted anywhere.

---

## 10. Deployment prerequisites

In order:

1. **Create `PetroTitan/logisticid-Magazine` on GitHub.** Requires a credential this environment does not have. Visibility should match the owner's policy — `PetroTitan/logisticid` is private; this is the one choice the brief asks not to be guessed.
2. **Push this repository to it.** `git` authenticates through the macOS keychain and can push to an existing repository today.
3. **Decide the Magazine's host.** Recommended: a **Netlify site in the same team as the main site** (§4.5). The alternative the brief names — Vercel — works but splits providers for no benefit (§4.6).
4. **Deploy standalone and verify on the infrastructure hostname:** base path, assets, `noindex` header, genuine 404, canonicals naming `logisticid.com`.
5. **Only then** add the rewrite to the main repository's `netlify.toml`, on a dedicated branch, together with a navigation link and a second `Sitemap:` line in `robots.txt`.
6. **Then** run the main site's own `pnpm validate` and its route regression checks, deploy, and prove isolation in both directions with real deployment IDs and timestamps.
