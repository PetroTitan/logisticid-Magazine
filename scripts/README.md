# Validation scripts

## `validate-routing.mjs`

Builds in the production configuration, starts a server, and makes real HTTP
requests. Run by `pnpm validate:routing` and as the last stage of `pnpm validate`.

It is not a unit test on purpose. Asset namespacing, genuine 404s, response
headers and infrastructure-hostname leaks are properties of served responses; a
test asserting the intent behind them passes on a build where every one is
broken. This script found two defects that lint, typecheck and the unit suite
all missed — missing security headers on the index route, and a validate
pipeline that graded a build it had not produced.

## `browser-qa.py`

Responsive and accessibility QA across 7 pages × 11 viewports (320×568 up to
2560×1440), driving real Chromium.

Requires Playwright. On this machine:

```
~/.claude/skills/seo/.venv/bin/python scripts/browser-qa.py
```

with a production server already running on port 4321.

It checks what a DOM query cannot: that the page never scrolls horizontally,
and that every interactive control is inside the viewport, unclipped, and
actually the topmost element at its own centre point (`elementFromPoint`) —
rather than merely present in the DOM behind something else. It also checks
heading order, landmarks, alt text, `lang`, console errors, touch-target size
(applying the WCAG 2.2 exemption for links inline in a sentence), and computes
contrast ratios from the real rendered colours rather than from the stylesheet.

It found the heading-order skip on the section and author pages, and a set of
touch targets between 20px and 32px that nothing else would have caught.
