import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { isInfrastructureHost } from "@/lib/env";

/**
 * Guards on the Railway hosting migration for the Magazine.
 *
 * The Magazine's migration risk differs from the main site's, and is worse in
 * one specific way: it has no public domain of its own and is reached only
 * through the main application. Nobody looks at it directly, so a Magazine
 * that is broken, unstyled or silently noindexed can go unnoticed for a long
 * time while the commercial site looks perfect.
 */

const ROOT = process.cwd();
const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

/** Source with comments stripped, so a guard cannot fail on its own rationale. */
function code(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");
}

const nextConfig = code("next.config.ts");

describe("standalone runtime", () => {
  it("starts the standalone server", () => {
    expect(packageJson.scripts.start).toBe("node .next/standalone/server.js");
  });

  it("chains the preparation into build, not into a lifecycle hook", () => {
    // The copy was wired to `postbuild`, and pnpm's `enable-pre-post-scripts`
    // default has flipped between major versions — so whether it ran was a
    // property of the package manager, not of this repository. On the main
    // site that shipped a standalone server with no static assets and took
    // the domain down. `&&` cannot be disabled by a setting.
    expect(packageJson.scripts.build).toBe(
      "next build && node scripts/prepare-standalone.mjs",
    );
    expect(packageJson.scripts.postbuild).toBeUndefined();
    expect(existsSync(join(ROOT, "scripts/prepare-standalone.mjs"))).toBe(true);
  });

  it("leaves the Netlify build path alone, because it is the rollback origin", () => {
    expect(nextConfig).toMatch(
      /process\.env\.NETLIFY\s*\?\s*\{\}\s*:\s*\{\s*output:\s*"standalone"/,
    );
  });

  it("copies into .next/static, not into a basePath-shaped subdirectory", () => {
    // `basePath` changes the URL the browser asks for, not the directory the
    // server reads from. A copy into `.next/static/magazine` would 404 every
    // chunk while the build log looked perfectly healthy.
    const script = code("scripts/prepare-standalone.mjs");
    expect(script).toMatch(/join\(ROOT, "\.next", "static"\)/);
    expect(script).not.toMatch(/"magazine"/);
  });

  it("tolerates having no public directory, because it has none", () => {
    // `basePath` does not rewrite `public/`, so every machine-readable
    // artifact here is a route handler and the directory legitimately does not
    // exist. Treating that as fatal failed a correct build once already.
    expect(existsSync(join(ROOT, "public"))).toBe(false);
    const script = code("scripts/prepare-standalone.mjs");
    expect(script).toMatch(/required:\s*false/);
    expect(script).toMatch(/required:\s*true/);
  });
});

describe("security headers", () => {
  it("sets its own HSTS rather than inheriting one from the host", () => {
    /**
     * MEASURED DURING THIS MIGRATION, AND THE REASON THIS TEST EXISTS.
     *
     * Under Netlify, HSTS was applied at the edge to every response on the
     * hostname, the proxied `/magazine/*` subtree included, so this
     * application deliberately did not set it and said so in a comment.
     *
     * Under Railway the composition is a Next.js rewrite inside the main
     * application, and a rewrite forwards the UPSTREAM's headers rather than
     * layering the proxying application's on top. Measured: a main-site page
     * carried HSTS, a page fetched through `/magazine` did not. The whole
     * editorial subtree would have lost it while every other URL on the domain
     * kept it — and nothing would have failed.
     */
    expect(nextConfig).toContain("Strict-Transport-Security");
    expect(nextConfig).toContain("max-age=31536000");
  });

  it("keeps matching the main site's other four headers", () => {
    for (const header of [
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "X-Frame-Options",
    ]) {
      expect(nextConfig, `${header} was dropped`).toContain(header);
    }
  });

  it("still uses the source pattern that covers the index route", () => {
    // `/(.*)` matches every route EXCEPT the index under this basePath, which
    // once left the Magazine home page with no security headers at all.
    expect(nextConfig).toContain('source: "/:path*"');
    expect(nextConfig).not.toContain('source: "/(.*)"');
  });
});

describe("production detection", () => {
  it("recognises Railway, and still recognises Netlify", () => {
    // If the host is not recognised, `isProductionDeployment()` returns false
    // and every response gets `X-Robots-Tag: noindex, nofollow`. The Magazine
    // would go live and quietly ask the entire web not to index it — a failure
    // with no error, no log line and no visible symptom.
    expect(nextConfig).toContain("RAILWAY_ENVIRONMENT_NAME");
    expect(nextConfig).toContain("CONTEXT");
    expect(nextConfig).toContain("VERCEL_ENV");
  });
});

describe("Railway hostnames can never become the Magazine's identity", () => {
  it("refuses every Railway hostname as a canonical origin", () => {
    // Railway hands out `*.up.railway.app` before any custom domain exists,
    // which is exactly when the Magazine gets tested — and exactly when a
    // canonical built from it would look correct to whoever is testing.
    for (const host of [
      "logisticid-magazine.up.railway.app",
      "magazine-production-1a2b.up.railway.app",
      "something.railway.app",
      "magazine.railway.internal",
    ]) {
      expect(isInfrastructureHost(host), `${host} was accepted`).toBe(true);
    }
  });

  it("still refuses the hosts it already refused", () => {
    for (const host of [
      "logisticid-magazine.netlify.app",
      "logisticid-magazine.vercel.app",
      "preview.netlify.live",
    ]) {
      expect(isInfrastructureHost(host), `${host} was accepted`).toBe(true);
    }
  });

  it("does not refuse the real one", () => {
    expect(isInfrastructureHost("logisticid.com")).toBe(false);
  });
});

describe("the health endpoint", () => {
  const raw = readFileSync(join(ROOT, "src/app/health/route.ts"), "utf8");
  const route = code("src/app/health/route.ts");

  it("documents the basePath-adjusted path Railway must be given", () => {
    // Railway's healthcheck path for this service must be `/magazine/health`.
    // `/health` 404s here, every probe fails, and every deployment is rejected
    // — with the previous one left serving, which at least fails safe.
    expect(existsSync(join(ROOT, "src/app/health/route.ts"))).toBe(true);
    expect(raw).toContain("/magazine/health");
  });

  it("reads no environment variable", () => {
    expect(route).not.toContain("process.env");
  });

  it("proves static assets are present rather than merely that a process runs", () => {
    expect(route).toContain(".next");
    expect(route).toContain("static");
    expect(route).toMatch(/503/);
  });

  it("is not indexable", () => {
    expect(raw).toMatch(/x-robots-tag/i);
  });
});
