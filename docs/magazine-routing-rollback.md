# Rollback — LogisticID Magazine

**Tested: NO.** Nothing has been deployed, so nothing has been rolled back. This is a procedure, not a rehearsed one, and it is written before deployment on purpose: the moment it is needed is the worst moment to design it.

---

## The property that makes rollback cheap

The Magazine is reached **only** through two ordered rewrite rules in the main site's `netlify.toml`: the exact `/magazine` homepage and the `/magazine/*` subtree. Those rules are the entire routing surface.

Removing it removes the Magazine from the public site and changes nothing else. The main application is untouched by it — no shared build, no shared bundle, no shared route tree, no runtime dependency in either direction.

The Magazine deployment can be left running afterwards. It is not reachable from the canonical host once the rule is gone, and its own infrastructure hostname carries `X-Robots-Tag: noindex, nofollow` on every route.

---

## Preferred rollback: disable the routing, keep the site up

Restores `logisticid.com` to its pre-integration behaviour.

1. In `PetroTitan/logisticid`, revert the commit that added the two `[[redirects]]` blocks to `netlify.toml` (`git revert <sha>`), or delete both blocks.
2. Push to `main`. Netlify rebuilds and redeploys the main site.
3. Verify:
   - `curl -sI https://logisticid.com/magazine` → **404**
   - `curl -sI https://logisticid.com/` → **200**, served by the main application
   - `/road-freight`, `/shippers`, `/carriers`, `/request-a-quote` all → **200**
   - `https://logisticid.com/robots.txt` and `/sitemap.xml` unchanged

**Faster, if the main site must be restored immediately:** roll back to the previous Netlify deploy from the Netlify UI. That restores the last known-good build in one step without waiting for a rebuild, and the `netlify.toml` revert can follow as the durable fix. Do not leave the site on a UI-published rollback indefinitely — the repository must end up matching what is deployed, or the next deploy silently reinstates the rule.

**DNS impact: none.** No DNS record changes in any rollback scenario. The domain stays attached to the main Netlify site throughout, which is precisely why this architecture was chosen over anything requiring the domain to move.

**Effect on the Magazine:** its own site keeps building and deploying. Only the public path is withdrawn.

---

## If the sitemap line was already published

Also remove the second `Sitemap:` line from `robots.txt` in the same revert. Leaving it advertises a sitemap of URLs that now 404, which teaches search engines the wrong thing about the host for as long as it is there.

If Magazine URLs were indexed before the rollback, they will 404. That is correct behaviour for a withdrawn section. Do not redirect them to the main site's pages: those pages are not the same content, and a redirect to an unrelated page is a soft-404 that is worse for the host than an honest one.

---

## Failure isolation — the design, and what is unverified

**By design**, a Magazine failure can affect only `/magazine/*`:

- a failed Magazine build leaves the previous Magazine deploy serving, and never touches the main site's build;
- a Magazine outage makes `/magazine/*` fail while every main route is served by the main application, which never consults the Magazine;
- nothing in the main application imports Magazine content, and the two feeds it may one day read (`latest.json`, `search-index.json`) are specified to degrade to main-site-only on failure.

Netlify's documented proxy timeout is 26 seconds, so a hung Magazine origin would delay `/magazine/*` requests up to that bound. Every Magazine route is statically generated, so there is no route that does work and nothing that would realistically approach it.

**Unverified:** all of the above. It is the intended behaviour of a system that has not been deployed. It must be confirmed by observation before anyone relies on it — see the isolation tests in `magazine-publishing-workflow.md`.
