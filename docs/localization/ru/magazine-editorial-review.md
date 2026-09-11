# Russian Magazine — editorial and SEO review record

> Phase 4U, worked 2026-09-11 on `feat/full-russian-localization-phase-4u`.
> Branch pushed, **not merged and not deployed**.

## The honesty statement, first

**No independent human Russian reviewer took part in this work.**

The Russian corpus is *agent-written, terminology-normalised against the
glossary in the main repository (`docs/localization/ru/terminology.md`), and
cold-read once*. It is described nowhere — not here, not in the corpus, not in
any page's metadata — as native-verified, human-reviewed, professionally
translated or a certified translation.

**Recommended before the Russian edition is promoted:** a native Russian
speaker with freight experience reads the five articles and the four standards
pages. About two hours. The articles carry regulatory and commercial meaning —
carrier liability under the applicable convention, the difference between a
typical and a guaranteed transit, the dangerous-goods boundary — and those are
the sentences where a translation can be fluent and wrong at the same time.

## Article ledger

Parity 5/5.

| English id | Russian slug |
| --- | --- |
| `welcome-to-logisticid-magazine` | `dobro-pozhalovat-v-logisticid-magazine` |
| `how-logisticid-magazine-sources-freight-information` | `otkuda-logisticid-magazine-beret-svedeniya-o-perevozkakh` |
| `ftl-ltl-express-and-pallet-freight-explained` | `ftl-ltl-ekspress-i-pallety-v-chem-raznitsa` |
| `how-to-evaluate-freight-market-and-transit-time-claims` | `kak-otsenivat-tsifry-o-rynke-i-sroki-dostavki` |
| `what-information-makes-a-road-freight-quote-request-actionable` | `kakie-svedeniya-delayut-zapros-stavki-otvechaemym` |

Each passed, in order: semantic translation → terminology → native rewrite →
source parity → title and lede → SEO → links → cold read. English and German
slugs are untouched.

## Terminology

The main repository's glossary governs; the Magazine adds no vocabulary of its
own. The load-bearing entries as they appear here:

| English | Russian | Note |
| --- | --- | --- |
| freight forwarder | экспедитор | What LogisticID is. |
| carrier | перевозчик | What the companies it engages are. Never LogisticID. |
| full truckload | полная загрузка (FTL) | Abbreviation kept: it is on every rate sheet. |
| part load | частичная загрузка (LTL) | Not `догруз`, which is yard talk, not a product. |
| groupage | сборные грузы | Hub-routed. Not the same as a part load. |
| pallet freight | паллетные перевозки | |
| express freight | экспресс-перевозки | **Explained as a dedicated vehicle, not a courier product**, in the first paragraph of the service section — «экспресс» in Russian reads as parcels. |
| loading metre | погрузочный метр | Never `погонный метр`, a different measurement. |
| CMR | накладная CMR | Not a ТТН and not a транспортная накладная. |

## Citations: what is translated and what is not

**Never translated.** A source's title, its issuing body, its publication, its
identifier and the date a person opened it. The Eurostat article is cited in
the Russian piece as *Road freight transport statistics*, Eurostat,
*Statistics Explained*, accessed 2026-09-01 — exactly as in the English one.
Photographers' names and licence identifiers are the same rule.

**Translated.** The kind of source (`Официальная статистика`), the words
«Дата обращения», the note that only an abstract was read, the heading
«Источники», and the alt text.

**Numbers keep their digits.** `13.3 billion tonnes` → `13,3 млрд тонн`;
`1 886 billion tonne-kilometres` → `1 886 млрд тонно-километров`. The test
asserts that every digit run in the English body appears in the Russian one.

## What the build found

**Every Cyrillic heading got the same fragment id.** `headingId` maps anything
outside `[a-z0-9]` to a hyphen, so a wholly Cyrillic heading reduced to nothing
and fell through to the `"section"` fallback: one id shared by every heading on
every Russian article, every in-page anchor landing on the first, and invalid
HTML. The duplicate-id check added in Phase 4T caught it on the first article,
before any of it shipped. `headingId` now carries the main site's Cyrillic
table.

**The index cluster was one-sided.** Each index page stated its own two-entry
`languages` map, so adding a third language left the English and German indexes
advertising each other while the Russian one advertised all three. That is the
defect the main site's Phase 4S-B2 shipped 59 of. Derived once now.

**The footer's standing note was German on every Russian page.** It read
`localized ? German : English`, which was correct with two locales and selects
German for any third one. All 16 Russian pages carried the German note and
linked `/magazine/de/redaktionsrichtlinien` — 14 occurrences of a German page
reached from a Russian one, unmarked. Found by crawling the rendered Russian
pages through Main's `/magazine/*` rewrite and following every link; invisible
in source, invisible to the type checker, and asserted by nothing. The note
branches three ways now and resolves its own link through
`staticPath("editorial-policy", locale)`, so the language of a note and the
language of its target can no longer disagree.

## Verification

Rendered HTML from a production build:

- **48 prerendered pages** — 16 English, 16 German, 16 Russian.
- **Sitemap 45 URLs**: 15 / 15 / 15.
- **45 pages advertise alternates; all 45 clusters are three-way; 0
  non-reciprocal.**
- 0 `lang` failures, 0 canonical mismatches, 0 pages without exactly one `h1`.
- 0 duplicate titles, 0 duplicate descriptions across all three languages.
- **0 mojibake**; every Russian page contains Cyrillic.
- Article JSON-LD: `inLanguage`, `url`, `mainEntityOfPage`, `headline`,
  `articleSection` and the image URL all correct on every Russian article.
- **48 served routes and 29 genuine 404s** asserted against the running server,
  including an English or German slug under `/ru/`, a Russian slug under either
  of the other two, and `/ru/magazine/*`.
- **174 tests pass** (151 before, 23 new).
- **Russian link audit, on the running pair:** 16 Russian Magazine pages,
  RU→RU 330 links, RU→EN 15, RU→DE 14 — every one of the 29 cross-language
  destinations marked with `hrefLang` and `lang`, 0 unmarked, 0 broken.
- Client JS **576,557 → 576,562 bytes, +5** — the sum of the `.js` chunks a
  build emits, against a clean build of `origin/main` in a worktree. No locale
  corpus reaches the browser.
- **Two builds are identical** under the same environment: same route set,
  byte-identical sitemap, identical client-JS total. Peak RSS 480 MB, 3.0 s
  wall. The sitemap's only build-to-build difference is the canonical origin,
  which comes from the environment — `validate-routing.mjs` supplies it and a
  bare `next build` does not.

## Carried forward

- **No human Russian review.** See the top of this document.
- **No Open Graph card image** in any language; articles use their hero
  photograph.
- **Section slugs stay English in Russian paths** — `/magazine/ru/road-freight/…`
  — as they do in German. Translating them is a taxonomy decision for all
  sections at once, and it moves published URLs.
- **The search page has no language switcher in any language** —
  `/magazine/search`, `/magazine/de/suche` and `/magazine/ru/poisk` all omit
  it. Russian is at parity with the other two; the gap is older than this
  phase.
- **`pnpm validate` leaves `.next/standalone` without static assets**, because
  it ends at `validate-routing.mjs`, which runs its own `next build` and not
  `prepare-standalone`. Run `pnpm build` afterwards, and assert a stylesheet
  answers 200 before trusting any browser measurement.
