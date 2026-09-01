# LogisticID Magazine

European road freight insight, practical shipping guidance and logistics intelligence from LogisticID.

An **independently deployed** editorial application, served to the public under `/magazine` on the LogisticID website. One public identity, two applications: publishing an article does not rebuild the main LogisticID site, and a main-site change does not rebuild the Magazine.

> **Deployment status: not deployed.** The application is complete and validated locally. Creating the GitHub repository and the hosting project requires credentials this environment does not have. See [`docs/logisticid-magazine-architecture-baseline.md`](docs/logisticid-magazine-architecture-baseline.md) §6.

## Getting started

```bash
corepack pnpm install
corepack pnpm dev     # http://localhost:3000/magazine
```

Node 24+, pnpm 11.21.0 via corepack — matching the main LogisticID repository.

## Validation

```bash
pnpm validate            # lint + typecheck + tests + production build + HTTP routing probe
pnpm validate:magazine   # the content corpus and its refusals
pnpm validate:seo        # structured data, feeds, Markdown safety
pnpm validate:routing    # builds in production config and probes a real server
```

`validate:routing` is not a unit test. It builds, starts a server, and makes real requests — because the properties that matter (assets resolving under `/magazine/_next`, genuine 404s, no infrastructure-hostname leaks, headers on *every* route) are properties of served responses. A test asserting the intent behind them passes on a build where all four are broken; this one caught two defects that lint, typecheck and unit tests all missed.

## Architecture

| Document | What it covers |
| --- | --- |
| [`architecture-baseline`](docs/logisticid-magazine-architecture-baseline.md) | What was audited and verified before any code; the blockers |
| [`routing-architecture`](docs/magazine-routing-architecture.md) | The same-host decision, options rejected, the measured `basePath` traps |
| [`main-site-integration`](docs/main-site-integration.md) | The exact change to make in the main repository |
| [`routing-rollback`](docs/magazine-routing-rollback.md) | How to withdraw the Magazine without touching the main site |
| [`publishing-workflow`](docs/magazine-publishing-workflow.md) | Research → draft → review → deploy → prove isolation |

### The three things worth knowing before editing

1. **`basePath: "/magazine"`, and routes live at the app root.** A directory `src/app/magazine/` would publish at `/magazine/magazine/…`.
2. **No `assetPrefix`.** `basePath` already namespaces `_next`; a second prefix doubles asset URLs and 404s.
3. **Machine-readable files are route handlers, never `public/`.** `basePath` does not rewrite `public/`, so a feed placed there works locally and 404s in production.

All three are asserted by `tests/routing/base-path.test.ts`.

## Content

Articles are Markdown files with JSON frontmatter in [`content/articles/`](content/articles). No database, no CMS.

The body is parsed into a **typed block tree** and rendered as React elements — never an HTML string. There is no `dangerouslySetInnerHTML` in the editorial render path, so raw HTML, `javascript:` URLs and script injection have no representation to travel through rather than a sanitiser that must catch them.

The build refuses to publish an article with a missing or duplicate URL, an unknown author or section, an invalid or future publication date, a citation that resolves to nothing, a listed-but-uncited source, a non-https source URL, an impossible access date, a hero image missing provenance or dimensions, a broken LogisticID link, or a slug containing a year. Each refusal has a test.

### Bylines

Articles are attributed to the **editorial team as an organisation**, and the JSON-LD emits `Organization` rather than `Person`.

This is not a placeholder. The main LogisticID site publishes no team members — `src/data/team.ts` there is deliberately empty — so there is no verified person to name. Inventing one would put fictional expertise behind guidance about customs, sanctions and dangerous goods. Named bylines work the moment real colleagues are published; add them to `src/content/authors.ts` with `isOrganization: false` and nothing else changes.

## Editorial standards

[Editorial policy](src/app/editorial-policy/page.tsx) · [Sourcing policy](src/app/sourcing-policy/page.tsx) · [Image and AI policy](src/app/image-policy/page.tsx) · [Corrections](src/app/corrections/page.tsx)

No fabricated rates, transit times, requirements, statistics or citations. No rankings or popularity claims. No advertising, affiliate links or paid placement. Where a fact has not been verified, the page says nothing rather than estimating.
