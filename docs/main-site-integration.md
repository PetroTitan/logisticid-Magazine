# Integrating the Magazine into the main LogisticID site

**Status: prepared, not applied.** No branch was created in `PetroTitan/logisticid`, nothing was staged there, and nothing was pushed.

## Why nothing was pushed

The integration's central change is a rewrite pointing at the Magazine's deployed hostname. **There is no Magazine deployment**, so that hostname does not exist yet.

A branch could have been pushed with a placeholder in it. That would put a rule into the production repository that looks configured and is not, on a branch named as though it were ready — and the failure mode if it were ever merged is that `/magazine/*` on the live commercial site proxies to nothing. Writing the exact change down and leaving the hostname visibly unresolved is the honest version.

Apply this **after** step 4 of the deployment prerequisites in `magazine-routing-architecture.md`, when a verified Magazine hostname exists.

---

## Branch

```
feat/magazine-integration
```

Four commits, in dependency order:

1. `build: route /magazine to the independent Magazine site`
2. `feat: add LogisticID Magazine to the site navigation`
3. `seo: advertise the Magazine sitemap in robots.txt`
4. `test: validate same-host Magazine routing`

**Stage explicit paths only.** The main repository has eight unmerged branches; `git add .` or `git add -A` there is how unrelated work gets swept into a commit.

---

## 1. The rewrite — `netlify.toml`

**Do not hand-write this block, and do not copy one from a document.** Generate it:

```bash
node scripts/print-integration-diff.mjs <magazine-host>
```

The script refuses to print anything until it has proved, against that exact hostname, that the Magazine home page and section pages return 200, that the sitemap route handler is served, that the host root and `/_next/*` return 404, that unknown paths 404, that every asset is namespaced under `/magazine/_next/` and loads, and that the canonical already names `logisticid.com`. It also refuses any hostname that looks like a placeholder.

That is the whole reason it exists. **Netlify does not validate a proxy destination at deploy time**, so a rewrite pointing at a mistyped, stale or never-created hostname deploys perfectly cleanly and then 404s every article on the live commercial site. The failure is silent at exactly the moment it is introduced.

The generated block is a `[[redirects]]` rule with `status = 200` and `force = true`, whose `to` repeats `/magazine` because the Magazine app is served under `basePath: "/magazine"` and `:splat` carries only the remainder. Dropping that second `/magazine` is the single most common way this is misconfigured, and it fails as a 404 on every article rather than as an error at deploy time.

Constraints to satisfy before this works (from Netlify's documentation, recorded in the ADR):

- the Magazine site must be in the **same Netlify team** — cross-team rewrites are not permitted;
- the Magazine site must **not** have password protection — rewrites to protected sites are not allowed;
- only one proxy hop is used, and the Magazine must not itself rewrite `/magazine/*`.

## 2. Navigation

One link, in the existing header component. Do not redesign the header or footer.

```tsx
<a className="site-nav__link" href="/magazine">Magazine</a>
```

A plain `<a>`, not `next/link`: `/magazine` is not a route in the main application's route tree, and asking the App Router to client-navigate to a path it has no build output for produces a client-side 404 on a URL that works perfectly on a hard refresh — an inconsistency that is confusing to debug.

## 3. Sitemap discovery — `robots.txt`

The main site's `robots.txt` currently advertises one sitemap. Add a second line:

```
Sitemap: https://logisticid.com/sitemap.xml
Sitemap: https://logisticid.com/magazine/sitemap.xml
```

Two `Sitemap:` lines rather than a sitemap index. Both are standards-compliant; two lines keep the corpora disjoint and — decisively — mean **publishing a Magazine article never requires the main application to rebuild**. A sitemap index owned by the main site would reintroduce exactly the coupling this architecture removes.

## 4. Routing regression test

Add to the main repository's existing suite: `/magazine` and `/magazine/road-freight` are **not** claimed by the main application's own route tree, so a future main-site route cannot silently capture the namespace.

## 5. Search integration — contract only

The Magazine publishes `/magazine/search-index.json` (versioned, static, cacheable) for the main site to consume later.

**The main LogisticID site has no production search.** No integration is written, and no contract is invented on its behalf. When search is built, it can fetch this document, and it must degrade to main-site-only results if the fetch fails — a Magazine outage must never be able to break search on the commercial site.

Likewise `/magazine/latest.json`, if the main site ever wants to surface recent articles.

---

## Regression gate before merging

Run the main repository's **own** `pnpm validate` (`eslint . && tsc --noEmit && vitest run && next build`) — its scripts are the authority, not this list.

Then confirm these routes are still served by the main application, unchanged:

```
/  /road-freight  /road-freight/ftl  /road-freight/ltl  /road-freight/express
/road-freight/pallets  /shippers  /carriers  /request-a-quote  /become-a-carrier
/routes  /about  /contact  /privacy  /terms  /cookies  /legal
/robots.txt  /sitemap.xml
```

Check specifically for: route capture, canonical changes, asset collisions, navigation regressions, horizontal overflow, and that the quote and carrier forms behave exactly as before.
