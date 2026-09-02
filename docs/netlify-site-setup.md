# Creating the LogisticID Magazine Netlify site

**Status: blocked on authentication.** The Netlify CLI is reachable (`npx netlify-cli`) but reports **"Not logged in."**, and `~/Library/Preferences/netlify/config.json` contains only `telemetryDisabled` and `cliId` — no stored credential. No `NETLIFY_AUTH_TOKEN` is set, and there is no Netlify MCP connector. The site cannot be created from here.

Everything the site needs from the repository side is already committed: `netlify.toml` is authoritative and complete.

---

## The one action required

Create a new Netlify site from `PetroTitan/logisticid-Magazine`, **in the same Netlify team as the main `logisticid.com` site.**

The team requirement is not a preference. Netlify's documentation states that **rewrites between sites belonging to different teams are not allowed**, so a Magazine site created under a different team cannot be proxied by the main site at all — and the failure appears later, as a broken `/magazine`, rather than at creation.

### Either — dashboard

1. **Add new site → Import an existing project → GitHub → `PetroTitan/logisticid-Magazine`.**
   The repository is private; the Netlify GitHub App needs access granted to it specifically.
2. Production branch: **`main`**.
3. **Leave every build field completely blank** — base directory, package directory, build command, publish directory, functions directory. Not the word "empty", not `.`, not `/`. `netlify.toml` supplies all of them and Netlify gives the file precedence.
   *This is the exact failure the main site already had: fields left unset in a site with no `netlify.toml`, producing an empty deploy that 404'd on every route. Here the file exists, so the fields must be blank so they cannot conflict with it.*
4. **Do not** enable password protection — Netlify forbids rewrites to a password-protected site, so it would silently break the proxy.
5. **Do not** attach a custom domain. This site is reached only through the main site's proxy.
6. Deploy, then record the stable production hostname (`<something>.netlify.app`).

### Or — CLI

```bash
npx netlify-cli login          # the blocking step
npx netlify-cli sites:create --account-slug <team-slug> --name logisticid-magazine
npx netlify-cli link --name logisticid-magazine
npx netlify-cli deploy --build --prod
```

`npx netlify-cli teams:list` gives the account slug once logged in.

No environment variables need to be set in the dashboard: `NEXT_PUBLIC_SITE_ORIGIN` and `NODE_VERSION` are both in `netlify.toml`, deliberately, so they are reviewable and cannot drift.

---

## Verify before touching the main repository

```bash
node scripts/print-integration-diff.mjs <the-new-hostname>
```

This refuses to emit anything until the deployment actually passes. It checks that `/magazine` and the section pages serve 200, the sitemap route handler serves, the host root and `/_next/*` return 404, unknown paths 404, every asset is namespaced under `/magazine/_next/` and loads, the canonical already names `logisticid.com`, and no infrastructure hostname leaks into the HTML.

Only when it prints the diff is the main-repository change safe to apply — and the diff it prints contains the verified hostname, never a placeholder.

Also confirm by hand that a **deploy preview** carries `X-Robots-Tag: noindex, nofollow`:

```bash
curl -sI https://deploy-preview-1--<site>.netlify.app/magazine | grep -i x-robots-tag
```

Netlify sets `CONTEXT` to `deploy-preview` there, which is what triggers the header.

---

## A residual risk to decide on, not to discover later

Once this site is live on its own `*.netlify.app` hostname, that hostname serves the **production** Magazine at 200 with **no** `X-Robots-Tag` — because for that site's own production deploys `CONTEXT` *is* `production`, which is exactly when the noindex header is correctly withheld.

And with `basePath: "/magazine"` the app cannot serve `/robots.txt` at that host's root at all: the path is outside its namespace and correctly 404s.

So the infrastructure hostname is technically crawlable. What protects it:

- **every page carries an absolute canonical to `https://logisticid.com/magazine/...`** — verified, on all 16 routes, with zero infrastructure-hostname leaks anywhere in the HTML, the feeds, the sitemap or the search index;
- the sitemap lists only `logisticid.com` URLs, so nothing advertises the infrastructure host;
- cross-host canonicals are the standard, and effective, answer to precisely this situation.

**The main `logisticid.com` site already has the identical exposure** on its own `startling-twilight-3a0788.netlify.app` hostname, so this is not a new class of risk being introduced — it is the existing one being inherited.

If it should be closed properly rather than mitigated, the clean fix uses a signal only the proxy can send. Netlify's `netlify.toml` rewrites support adding a header to the proxied request:

```toml
[[redirects]]
  from = "/magazine"
  to = "https://<host>/magazine"
  status = 200
  force = true
  headers = {X-LogisticID-Proxy = "1"}

[[redirects]]
  from = "/magazine/*"
  to = "https://<host>/magazine/:splat"
  status = 200
  force = true
  headers = {X-LogisticID-Proxy = "1"}
```

The Magazine would then emit `X-Robots-Tag: noindex` unless that header is present — which requires Next.js middleware, and therefore an edge function on every request to a site that is otherwise entirely static.

**That trade — a runtime on every request, to close a gap canonicals already largely cover — is a judgement call for the owner, so it has deliberately not been made here.** It is recorded so it can be decided rather than stumbled into.
