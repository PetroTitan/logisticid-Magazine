# Deploying LogisticID Magazine on Railway

> Everything needed to build, run, configure and verify this application,
> **without reading the main LogisticID repository**. Railway documentation
> consulted 2026-09-04.

## What this application is, in deployment terms

An independently deployed Next.js application that is served to the public
under `https://logisticid.com/magazine/*`.

It has **no public domain of its own, by design**. It is reached only through
the main LogisticID application, which owns the `/magazine` prefix and proxies
to this service. On Netlify that was a `status = 200` rewrite in the main
site's `netlify.toml`; on Railway it is a Next.js `rewrites()` in the main
site's `next.config.ts`. Either way, **this repository has never contained the
routing rule and still does not.**

The consequence worth internalising: nobody looks at this application
directly. A Magazine that is broken, unstyled or silently `noindex`ed can go
unnoticed while the commercial site looks perfect. Every check below exists
because of that.

## Railway service settings

| Setting | Value |
| --- | --- |
| Project | `LogisticID` (shared with the main site's `web` service) |
| Service name | `magazine` |
| Source | GitHub `PetroTitan/logisticid-Magazine`, branch `main` |
| Builder | Railpack |
| Build command | `pnpm build` |
| Start command | `pnpm start` → `node .next/standalone/server.js` |
| **Healthcheck path** | **`/magazine/health`** |
| Healthcheck timeout | 300 s (default) |
| Restart policy | `ON_FAILURE`, 10 retries |
| Region | `europe-west4-drams3a` (EU West Metal, Amsterdam) |
| Replicas | 1 |
| Public networking | **disabled** |
| Custom domain | **none** |

### ⚠ The healthcheck path is `/magazine/health`

`basePath: "/magazine"` prefixes **every** route this application emits, the
health endpoint included. `/health` returns 404 here. Configure `/health` and
every probe fails, so no deployment is ever promoted — the previous one keeps
serving, which at least fails safe, but nothing ships and the cause is not
obvious from the deploy log.

### Why public networking is off

The main site reaches this service over Railway's private network at
`magazine.railway.internal`. Leaving public networking off means the
`*.up.railway.app` hostname never exists, so it can never be linked, crawled,
or mistaken for the publication's address.

If a public URL is needed temporarily for diagnosis, enable it, and remember
that `src/lib/env.ts` refuses `*.up.railway.app` as a canonical origin outright
— the application will throw rather than publish it. That is intended.

## Environment variables

| Variable | Phase | Required | Value |
| --- | --- | :-: | --- |
| `NEXT_PUBLIC_SITE_ORIGIN` | build + runtime | **yes** | `https://logisticid.com` |
| `RAILWAY_ENVIRONMENT_NAME` | both | auto | `production` |
| `PORT` | runtime | auto | Railway-assigned |

That is the complete list. This application has no secrets, no database, no
mail provider and no authentication.

### `NEXT_PUBLIC_SITE_ORIGIN` is the MAIN site's origin

Not this service's hostname. Every canonical tag, feed link, sitemap entry,
Open Graph URL and JSON-LD `url` is built from it. Pointing it at an
infrastructure hostname would teach search engines the wrong identity for the
publication, which is expensive to reverse — so `assertNoInfrastructureHost()`
refuses `.up.railway.app`, `.railway.app`, `.railway.internal`, `.netlify.app`,
`.vercel.app` and others as an origin.

### `RAILWAY_ENVIRONMENT_NAME` decides indexability

`isProductionDeployment()` in `next.config.ts` checks it, alongside Netlify's
`CONTEXT` and Vercel's `VERCEL_ENV`. If **none** matches, the deployment is
treated as a preview and every response gets `X-Robots-Tag: noindex, nofollow`
— including the feeds and the sitemap, which have no HTML head to carry a meta
tag.

That is correct for a preview and catastrophic for production: the Magazine
would go live and quietly ask the entire web not to index it, with no error and
no visible symptom. Railway sets this variable itself; the value must be
`production` on the production environment.

## The port the main site needs

The main site's `MAGAZINE_ORIGIN` must be
`http://magazine.railway.internal:<this service's PORT>`.

**It is a build-time variable over there.** Next.js resolves `rewrites()` once,
during `next build`, and freezes the destination into `routes-manifest.json`.
A main-site build that ran without it bakes in a localhost fallback, and then
every `/magazine/*` URL returns 500 `ECONNREFUSED` in production — on a
deployment whose own pages are all healthy and whose healthcheck passes.

So: after changing this service's port or name, **redeploy the main site.**

## Build output

`output: "standalone"` is enabled — except on Netlify, which remains the
rollback origin and whose Next.js runtime does its own output handling.

`postbuild` runs `scripts/prepare-standalone.mjs`, which copies `.next/static`
next to the standalone server. Next.js does not do this itself, and without it
every page renders with no CSS and no JavaScript while returning 200.

This application has **no `public/` directory** and correctly needs none:
`basePath` does not rewrite `public/`, so every machine-readable artifact here
is a route handler instead —

```
/magazine/sitemap.xml      /magazine/rss.xml       /magazine/atom.xml
/magazine/feed.json        /magazine/latest.json   /magazine/search-index.json
```

The preparation script treats a missing `public/` as normal for this reason,
and a missing `.next/static` as fatal.

## Verifying a deployment

Locally, exactly as Railway runs it:

```bash
NEXT_PUBLIC_SITE_ORIGIN=https://logisticid.com \
RAILWAY_ENVIRONMENT_NAME=production \
pnpm build

NEXT_PUBLIC_SITE_ORIGIN=https://logisticid.com \
RAILWAY_ENVIRONMENT_NAME=production \
PORT=4322 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

Then check:

- [ ] `/magazine/health` → 200 `ready`
- [ ] `/magazine` → 200
- [ ] `/magazine/sitemap.xml` → 200, 15 URLs, all `https://logisticid.com/magazine/...`
- [ ] `/magazine/rss.xml` → 200 `application/rss+xml`
- [ ] `/magazine/feed.json` → 200 `application/json`
- [ ] an article renders and its canonical is on `logisticid.com`
- [ ] every asset reference is under `/magazine/_next/` — never bare `/_next/`
- [ ] `strict-transport-security: max-age=31536000` is present
- [ ] `X-Robots-Tag` is **absent** (present means production was not detected)
- [ ] `/magazine/not-a-real-page` → 404

`pnpm validate` runs lint, typecheck, the full test suite and
`scripts/validate-routing.mjs`, which builds and probes the routes and asserts
every asset reference sits under `/magazine/_next/`.

## Deployment independence

This service deploys from its own repository on its own trigger. A Magazine
release does not rebuild the main site and does not need to.

The one exception is the port: if this service's `PORT` or name changes, the
main site's `MAGAZINE_ORIGIN` changes with it, and the main site must be
redeployed for the new value to take effect.

## Rollback

Netlify continues to build this repository from `main` throughout the migration
window, and the Netlify build path is deliberately unchanged — `output:
"standalone"` is suppressed there. Rollback is a DNS change on the main
domain; nothing in this repository needs to be rebuilt or reverted.

Do not delete this repository's Netlify site until the main repository's
`docs/hosting/railway-rollback.md` decommission gate has been signed off.
