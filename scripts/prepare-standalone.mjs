#!/usr/bin/env node
/**
 * Make `.next/standalone` actually runnable.
 *
 * WHY THIS EXISTS
 *
 * `output: "standalone"` emits `.next/standalone/server.js` plus the minimal
 * `node_modules` the server traced. It deliberately does NOT copy two things
 * that every page needs:
 *
 *   - `public/`        — the photography, the favicon, robots' static siblings
 *   - `.next/static/`  — every JavaScript chunk and stylesheet on the site
 *
 * Next.js documents this and leaves the copy to the deployment. Railway's own
 * Next.js guide does it with `COPY` lines inside a Dockerfile. This repository
 * does not use a Dockerfile, so it does it here.
 *
 * THE FAILURE THIS PREVENTS IS QUIET, WHICH IS WHY IT IS A SCRIPT AND NOT A
 * README STEP. Without the copy the server boots, answers the healthcheck,
 * renders HTML and returns 200 for every route. Only the CSS, the JavaScript
 * and every image 404. A deployment in that state looks healthy to a
 * healthcheck, to an uptime monitor and to `curl -I`.
 *
 * Run from `postbuild`, so `pnpm build` alone is sufficient and nobody has to
 * remember a second command — including Railway, which runs the build script
 * and nothing else.
 *
 * MAGAZINE NOTE. This application has `basePath: "/magazine"`, so its chunks
 * are served at `/magazine/_next/static/*`. The copy below is still to
 * `.next/static` — `basePath` changes the URL the browser requests, not the
 * directory the server reads from. A copy into a `magazine/` subdirectory
 * would be wrong and would 404 everything.
 */

import { cp, access, readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const STANDALONE = join(ROOT, ".next", "standalone");

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(STANDALONE))) {
  // Not an error: a build without `output: "standalone"` has nothing to
  // prepare, and this script must not fail such a build.
  console.log("prepare-standalone: no .next/standalone directory — nothing to do.");
  process.exit(0);
}

/**
 * `required` distinguishes the two cases, and the distinction is real rather
 * than defensive.
 *
 * `.next/static` is emitted by every build of every Next.js application. If it
 * is absent, the build did not complete and there is nothing to serve.
 *
 * `public/` is optional because an application may legitimately have none. The
 * Magazine is exactly that case: it has `basePath: "/magazine"`, `basePath`
 * does not rewrite `public/`, so every machine-readable artifact it publishes
 * is a route handler and the directory does not exist. Treating that as a
 * failure would fail a correct build.
 *
 * But a `public/` that exists and is not copied is silent data loss — on the
 * main site that is 156 photography files and the favicon — so the rule is
 * "copy what is there", not "copy if convenient": the source is checked once,
 * and if it exists the copy must succeed.
 */
const copies = [
  {
    from: join(ROOT, "public"),
    to: join(STANDALONE, "public"),
    label: "public/",
    required: false,
  },
  {
    from: join(ROOT, ".next", "static"),
    to: join(STANDALONE, ".next", "static"),
    label: ".next/static/",
    required: true,
  },
];

const copied = new Set();

for (const { from, to, label, required } of copies) {
  if (!(await exists(from))) {
    if (required) {
      console.error(`prepare-standalone: ${label} is missing from the build output.`);
      process.exit(1);
    }
    console.log(`prepare-standalone: no ${label} in this application — skipping.`);
    continue;
  }
  await cp(from, to, { recursive: true });
  const count = (await readdir(to, { recursive: true })).length;
  console.log(`prepare-standalone: copied ${label} → ${count} entries`);
  copied.add(label);
}

/**
 * Prove the copy landed where the server will look for it, rather than
 * trusting that `cp` did what it was told. The server resolves both of these
 * relative to its own directory, so this is the exact question that matters.
 */
const mustExist = [join(STANDALONE, ".next", "static"), join(STANDALONE, "server.js")];
if (copied.has("public/")) mustExist.push(join(STANDALONE, "public"));

for (const required of mustExist) {
  if (!(await exists(required))) {
    console.error(`prepare-standalone: expected ${required} to exist after preparation.`);
    process.exit(1);
  }
}

console.log("prepare-standalone: .next/standalone is ready to serve.");
