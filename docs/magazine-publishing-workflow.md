# Publishing workflow — LogisticID Magazine

How an article gets from an idea to a live URL, and how a deployment is proven not to have touched the main site.

---

## 1. Research

Gather sources **before** drafting. The [sourcing policy](../src/app/sourcing-policy/page.tsx) sets the hierarchy: EU institutions and EUR-Lex, national authorities, UNECE, Eurostat and national statistics offices, research institutions, standards bodies, sector institutions, official operator documentation, first-party announcements, manufacturer documentation.

Record the **real** date each source was opened. Never generate it, never set it to the publication date.

If a source could only be read as an abstract — a paywalled standard, typically — set `"fullTextConsulted": false` on it. The page then says so, and the article does not claim a reading that did not happen.

## 2. Draft

Create `content/articles/<slug>.md` with JSON frontmatter. Start at `"status": "DRAFT"`. Drafts live in the repository and are reviewable in a pull request; they are never rendered, listed, indexed or linkable.

Slugs are durable and lowercase, and **carry no date** — the build rejects a slug containing a four-digit year. Dates are metadata; in a path they make an updated article look stale forever.

The body uses the restricted editorial Markdown subset (`src/content/markdown.ts`). Raw HTML, `javascript:` and `http:` links, and a second `h1` are all build errors rather than silent output.

## 3. Verify every material claim

For each factual assertion, confirm the cited source actually supports it — not that it is topical, that it says this. Cite in text with `[^source-id]`.

The build enforces both directions: an article citing an unlisted source will not publish, and an article listing an uncited source will not publish either.

Apply calibrated language where an outcome genuinely depends on route, cargo, equipment, contract, jurisdiction, date or carrier acceptance. Put a `:::boundary` callout where a reader should stop and consult a professional — and only there. A boundary note in every paragraph teaches readers to skip them.

Regulatory or market content additionally needs `jurisdiction` and `informationCurrentAsOf`.

## 4. Editorial review

Reviewed by someone other than the drafter. Specifically check:

- no invented rate, transit time, availability, requirement, statistic or citation;
- no ranking, "best/cheapest/fastest", or popularity claim;
- the professional boundary is present where it matters;
- `schemaType` is honest — `NewsArticle` only for genuinely time-sensitive reporting, `Article` for everything evergreen;
- image provenance is complete, and any illustration is marked `illustrative`.

## 5. Preview

Open a pull request. Set `"status": "PUBLISHED"` only when the article is genuinely ready.

Preview deployments carry `X-Robots-Tag: noindex, nofollow` on every route, and must never be submitted to a search engine.

## 6. Technical validation

```
pnpm validate
```

Runs `eslint`, `tsc --noEmit`, the full test suite, and `validate:routing` — which builds in the production configuration and probes a real server for served routes, genuine 404s, asset namespacing, canonicals, headers and infrastructure-hostname leaks.

Sub-gates for a faster loop: `pnpm validate:magazine` (content), `pnpm validate:seo` (structured data, feeds, Markdown safety), `pnpm validate:routing` (HTTP behaviour).

## 7. Merge and deploy

Merge to `main` in the **Magazine** repository. That triggers a Magazine deployment and **nothing else**.

## 8. Production QA — on raw responses, not just in a browser

```bash
ART=https://logisticid.com/magazine/<section>/<slug>

curl -s "$ART" | grep -c "<h1"                                    # exactly 1
curl -s "$ART" | grep -o '<link rel="canonical"[^>]*>'            # the canonical above
curl -s "$ART" | grep -cE "vercel\.app|netlify\.app"              # 0
curl -sI https://logisticid.com/magazine/does-not-exist | head -1  # 404
curl -s https://logisticid.com/magazine/sitemap.xml | grep "<loc>" | grep "<slug>"
```

Check in a browser too: the article renders styled (if it does not, the rewrite is not covering `/magazine/_next/*`), navigation works, a hard refresh works, and the console is clean.

## 9. Feeds and sitemap

Confirm the article appears in `/magazine/rss.xml`, `/magazine/feed.json`, `/magazine/latest.json`, `/magazine/search-index.json` and `/magazine/sitemap.xml`, and that none of them names an infrastructure hostname.

## 10. IndexNow — not yet available

**The main LogisticID site has no IndexNow implementation.** No key, no key file, no submission code exists in that repository. Nothing here submits anything, and no submission capability was invented.

If IndexNow is added to the main site later, the correct arrangement follows from the specification: a key file at the **host root** authorises every URL on that host, so the main site would own the key and the Magazine would submit with the apex `keyLocation`. A key in a subdirectory would scope only to that subdirectory.

Only ever submit a URL that: exists on the canonical same-host address, returns 200, has a correct canonical, appears in the Magazine sitemap, and has been verified in raw HTML. Never submit a preview or infrastructure URL. Submission failure must never fail a deployment, and the response status must be logged as received.

## 11. Prove the main site did not rebuild

This is the step that makes the architecture real rather than asserted. Do it on the first Magazine deployment after integration, and after any change to the rewrite.

**Test A — a Magazine-only change.** Make a harmless correction, merge, deploy. Record the Magazine's source SHA, deployment ID and timestamp. Then confirm the **main** site produced no new deployment.

**Test B — a main-only change.** Make a harmless main-site change, merge, deploy. Record its SHA, deployment ID and timestamp. Then confirm the **Magazine** produced no new deployment.

Record all six values. Neither direction may be inferred from the architecture — the whole point is to observe it.

**Failure isolation.** With the Magazine site stopped or failing, confirm `/`, the service pages, `/shippers`, `/carriers`, `/request-a-quote`, the legal pages, `/robots.txt` and `/sitemap.xml` all still serve normally, and that only `/magazine/*` is affected.

---

## Corrections

When a published article is materially wrong:

1. correct the article;
2. add a dated entry to `updateHistory` saying what changed;
3. set `correctionNote` describing the original claim — the build refuses a `correctionNote` without a matching `updateHistory` entry;
4. set `"status": "UPDATED"` and `dateModified`.

The article and `/magazine/corrections` both update from the same record, so they cannot disagree. Describe what was wrong rather than deleting it: a reader who acted on the earlier version needs to know whether it affected them.
