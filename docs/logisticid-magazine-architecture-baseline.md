# LogisticID Magazine — architecture baseline

**Audit date:** 2026-09-01
**Audited by:** automated agent session, from the live repository, the live production host and the authenticated Vercel API.

This document records what was **verified**, what is **assumed**, and what is **unknown**, before any Magazine code was written. It exists because the brief that commissioned this work contained an infrastructure premise that turned out to be false, and the correction changes the architecture.

---

## 1. The headline finding: the main site is on Netlify, not Vercel

The brief describes routing `/magazine/*` from "the existing LogisticID **Vercel** project" to a new one, and asks for Vercel Multi-Zones or Vercel Microfrontends to be evaluated as the same-host mechanism.

**There is no LogisticID Vercel project.**

| Check | Result |
| --- | --- |
| `vercel list_projects` for team `petrotitans-projects` (`team_XVsatleKgqptkBkRWGq7L0Xs`, plan: pro) | Two projects only: `builddesignhub-com`, `faunahub-com`. No LogisticID project. |
| `.vercel/project.json` in the repository | Absent — the repository has never been linked to a Vercel project locally. |
| `dig logisticid.com` | `75.2.60.5`; `www` → `startling-twilight-3a0788.netlify.app` |
| `curl -I https://logisticid.com` | `HTTP/2 200`, `server: Netlify`, `x-nf-request-id`, `cache-status: "Netlify Durable"` |
| `docs/PRODUCTION-DEPLOYMENT.md` in the main repository | States plainly: **"Host: Netlify. Production domain: https://logisticid.com."** |
| `netlify.toml` at the repository root | Present and documented as authoritative, declaring `@netlify/plugin-nextjs`. |

The repository's own deployment document and the live HTTP response agree with each other and disagree with the brief. Per the brief's own instruction — *"Repository truth wins over this historical summary"* — the repository wins, and this contradiction is recorded here rather than worked around.

**Consequence:** Vercel Microfrontends is *inapplicable*, not merely unattractive. It routes between Vercel projects under a domain a Vercel project serves. `logisticid.com` is served by Netlify. See `magazine-routing-architecture.md` for what replaces it.

---

## 2. Canonical production hostname — VERIFIED

**`https://logisticid.com`** is live, returns HTTP 200, and serves the LogisticID Next.js application.

Corroboration from three independent places:

- the live HTTP response (Next.js headers `x-nextjs-prerender`, `x-nextjs-stale-time`);
- `docs/PRODUCTION-DEPLOYMENT.md`;
- `.env.example`, which documents `NEXT_PUBLIC_APP_URL` as `https://logisticid.com` in production.

`src/config/company.ts` in the main repository states the rule that keeps this single-sourced: the origin lives only in `NEXT_PUBLIC_APP_URL`, never duplicated into config.

The `/magazine` namespace is **free**: `https://logisticid.com/magazine` and `https://logisticid.com/magazine/road-freight` both returned 404 at audit time.

`https://logisticid.com/robots.txt` currently reads:

```
User-Agent: *
Allow: /

Sitemap: https://logisticid.com/sitemap.xml
```

One sitemap is advertised. Adding a second line for the Magazine sitemap is the integration change described in the routing document.

---

## 3. Main repository state — VERIFIED

| Item | Value |
| --- | --- |
| Remote | `https://github.com/PetroTitan/logisticid.git` (**private** — anonymous HTTPS returns 404) |
| Default branch | `main` |
| `origin/main` HEAD | `b46e26d` — *"Merge pull request #10 from PetroTitan/feat/global-freight-content-wave1"* |
| Checked-out branch | `feat/global-authority-phase-4c` @ `a15de4e` |
| Working tree | **Clean** — no dirty or untracked work to protect |
| `origin/feat/design-v1` | `344939b` — present on the remote, **not merged into `main`** |
| Unmerged remote branches | `feat/corporate-site-v1`, `feat/design-v1`, `feat/ecosystem-consent`, `feat/global-authority-phase-4c`, `feat/global-freight-content-wave1`, `feat/platform-foundation`, `fix/netlify-production-deployment`, `fix/production-qa` |
| Next.js / React | `16.3.0` / `19.2.8` |
| Node / package manager | `>=24.0.0` / `pnpm@11.21.0` (this Mac: node `v24.15.0`, pnpm via `corepack`) |
| Validation command | `pnpm validate` = `eslint . && tsc --noEmit && vitest run && next build` |
| Route count | 46 `page.tsx` files under `src/app` |
| `next.config.ts` | Four security headers on `/(.*)`. **No redirects, no rewrites, no middleware, no `basePath`.** HSTS and CSP deliberately deferred (documented in `docs/SECURITY.md`). |

**Nothing in the main repository was modified during this audit.** No files were staged, committed or deleted, and no branch was created there.

---

## 4. Product truth carried into the Magazine — VERIFIED

From `docs/CURRENT-SCOPE.md`, `docs/PRODUCT-TRUTH.md` and `src/config/company.ts`:

- LogisticID is a **corporate website** for a freight forwarding business. No database, no auth, no TMS.
- Current operation: **European road freight**, arranged through **third-party transport providers**.
- Current services: **FTL, LTL, Express, Pallet**.
- **No operating company has been incorporated.** A Czech s.r.o. is planned; no legal name, IČO, DIČ, registered office or director exists, and the site must not imply any is pending.
- Palette: blue `#0874C9`, orange `#F58220`, black `#111111`, white `#FFFFFF` — confirmed in `src/styles/globals.css` and `docs/DESIGN-SYSTEM.md`.
- Identity: orange connected-route mark plus the LogisticID wordmark (`src/components/brand.tsx`).

### The finding that shaped the Magazine's byline model

`src/data/team.ts` is **deliberately an empty list**. Its header states the binding rule: *"only real people who have agreed to be published may appear here. Never invent a colleague, a biography, a job title, a LinkedIn profile or a credential."*

**There is not one verified, publishable human associated with LogisticID.**

A magazine needs bylines, and the obvious move — invent a plausible freight editor — would put a fictional person's expertise behind guidance about customs, sanctions and dangerous goods. The Magazine therefore attributes articles to the **editorial team as an organisation**, and emits `Organization` rather than `Person` in its JSON-LD so the structured data states what is actually true. Named bylines become available the moment real colleagues are published; nothing else in the application changes.

---

## 5. Monitoring and analytics — VERIFIED PRESENT, deliberately not extended

The main site sends consent-gated page views to WebmasterID (`src/config/analytics.ts`, `webmasterid-ingest-api.vercel.app`), with a documented CSP `connect-src` requirement and a consent notice.

The Magazine ships **no analytics**. Adding a second consent surface and a second ingest path under the same hostname is a privacy and CSP decision for the main product's owner, not something to introduce from an editorial project. The clean future event contract is described in the routing document.

---

## 6. Blockers — VERIFIED, and load-bearing

Two hard blockers stop this work short of a deployment. Both are credential blockers; **neither is an architecture problem.**

### 6.1 No GitHub API access — the Magazine repository cannot be created

- `gh` is **not installed**.
- No `GITHUB_TOKEN` or equivalent is present in the environment.
- `git` authenticates to GitHub through the **macOS keychain** (`credential.helper = osxkeychain`), and `git ls-remote origin` succeeds — so **pushing to an existing repository works**.
- Reading that stored credential in order to call the GitHub API (which is what creating a repository requires) was **blocked by this environment's permission policy**. That block was respected and not worked around.

`git` can push. `git` cannot create a repository. Creating `PetroTitan/logisticid-Magazine` requires either the `gh` CLI, a token, or a human clicking "New repository".

Whether `PetroTitan/logisticid-Magazine` already exists **could not be determined**: the org's repositories are private, so an anonymous request returns 404 for `PetroTitan/logisticid` — a repository that certainly exists. **A 404 here is not evidence of absence.**

### 6.2 Vercel project creation

`create_git_project` also requires the GitHub repository to exist first, so it is blocked behind 6.1 regardless. Separately, a prior session on a sibling project recorded that both `deploy_to_vercel` and `create_git_project` returned **403 "You don't have permission to create a project"** on this same MCP token — the token is read-and-deploy-to-existing only.

That 403 is **prior evidence, not re-verified in this session**: re-testing it would have meant creating a real Vercel project for a real repository as a side effect, which is not a safe probe.

**This blocker may be moot.** The main site is on Netlify, so the recommended architecture does not require a Vercel project at all — see the routing document.

---

## 7. Unknowns

Explicitly not established, and not guessed:

1. **Whether `PetroTitan/logisticid-Magazine` exists.** Requires authenticated access.
2. **Repository visibility policy.** `PetroTitan/logisticid` is private. Whether the Magazine should match is a decision for the owner — the brief asks for it not to be guessed.
3. **Netlify account, team and plan.** No Netlify credential is available in this environment, so the Netlify side of the deployment was audited only through the repository and the live HTTP responses.
4. **Whether the proxy rewrite behaves as documented on this specific site.** Documented behaviour is recorded in the routing document; a rewrite's real interaction with the Next.js runtime on the main site is a deployment observation, and no deployment was made.
5. **IndexNow.** No IndexNow key, submission code or key file was found anywhere in the main repository. There is **no existing IndexNow architecture to extend**, and none was invented.
6. **Deployment isolation.** Cannot be proven without two live deployments. Nothing in this work claims it.

---

## 8. What was verified about the Magazine itself

Everything in this section was measured against a real production build served over HTTP on this machine.

- Build: **24 routes**, clean `eslint`, clean `tsc --noEmit`, **57 tests passing**.
- Every asset resolves under **`/magazine/_next/`** — 9 asset references checked, all namespaced, all HTTP 200.
- The application **claims nothing outside `/magazine`**: `/`, `/road-freight` and `/_next/static/*` all return **404** from the Magazine server. This is what makes it safe to place behind a proxy on a host another application already owns.
- Unknown Magazine paths return a **genuine HTTP 404**, not a 200 fallback.
- Canonical on a production build: `https://logisticid.com/magazine/road-freight/ftl-ltl-express-and-pallet-freight-explained`.
- **Zero** infrastructure-hostname occurrences across all 16 served routes, HTML and machine-readable alike.
- Preview builds carry `X-Robots-Tag: noindex, nofollow` on every route; production builds carry none.

### A defect this audit found and fixed

The security headers were configured as `source: "/(.*)"`, copied from the main site's `next.config.ts`. Measured on Next.js 16.3.0 **under a `basePath`, that pattern matches every route except the index** — so the Magazine home page was served with *no security headers at all*, while every other page had them.

It was invisible to typecheck, lint, and to any test that asserts what the config intends. Only an HTTP request to `/magazine` showed it. The fix is `source: "/:path*"`, and `scripts/validate-routing.mjs` now asserts `X-Content-Type-Options` on every route so it cannot regress.

A second, similar defect was found in the validation pipeline itself: `pnpm validate` built with default environment and then probed a server started with production environment, so the validator reported thirty failures against a build that was never the one under test. `validate:routing` now performs its own build in the environment it serves.
