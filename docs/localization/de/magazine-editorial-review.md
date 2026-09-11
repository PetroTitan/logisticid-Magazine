# German Magazine — editorial and SEO review record

> Phase 4T, worked 2026-09-11 on `feat/german-magazine-editorial-localization-phase-4t`.
> Branch pushed, **not merged and not deployed**.
> The architecture is in `docs/localization/magazine-localization.md`; this
> document is the record of what was translated, what was checked and what was
> deliberately not claimed.

## The honesty statement, first

**No independent human German reviewer took part in this work.**

The German corpus below is *agent-written, terminology-normalised against the
main site's German glossary, and cold-read once as a whole*. It is described
nowhere — not in this document, not in the corpus, not in any page's metadata
— as native-verified, human-reviewed, professionally translated or a certified
translation, because it is none of those things.

**Recommended before the German Magazine is promoted:** a native German
freight professional reads the five articles and the four standards pages.
About two hours of reading. The articles carry regulatory and commercial
meaning — § 453 HGB *Spedition* versus § 407 HGB *Frachtführer*, the
distinction between a typical and a guaranteed transit — and those are the
sentences where a translation can be fluent and wrong at the same time.

## Scope

Phase 4T translated the **existing** corpus. It did not commission, plan or
write a new article in either language; §42 of the brief forbids it and the
English corpus is unchanged in content.

## Article ledger

All five localizable English articles have a German counterpart. Parity 5/5.

| English id | English slug | German slug | Status |
| --- | --- | --- | --- |
| `what-information-makes-a-road-freight-quote-request-actionable` | `what-information-makes-a-road-freight-quote-request-actionable` | `welche-angaben-eine-frachtanfrage-beantwortbar-machen` | Published in 4S-A; slug **frozen**, typography corrected |
| `ftl-ltl-express-and-pallet-freight-explained` | `ftl-ltl-express-and-pallet-freight-explained` | `ftl-ltl-express-palettenversand-unterschiede` | New in 4T |
| `how-to-evaluate-freight-market-and-transit-time-claims` | `how-to-evaluate-freight-market-and-transit-time-claims` | `frachtmarktzahlen-und-laufzeitangaben-einordnen` | New in 4T |
| `how-logisticid-magazine-sources-freight-information` | `how-logisticid-magazine-sources-freight-information` | `woher-logisticid-magazine-seine-informationen-bezieht` | New in 4T |
| `welcome-to-logisticid-magazine` | `welcome-to-logisticid-magazine` | `willkommen-bei-logisticid-magazine` | New in 4T |

Per article, every column below was done and is enforced by
`tests/content/german-edition.test.ts` where it can be:

| Article | Title | Lede | Body | Terminology | Sources | SEO | Cold read | hreflang | Schema | Links | Hero/alt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `welche-angaben-…` | ✓ | ✓ | ✓ (4S-A) | ✓ | n/a — no sources | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ftl-ltl-express-palettenversand-unterschiede` | ✓ | ✓ | ✓ | ✓ | n/a — no sources | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `frachtmarktzahlen-und-laufzeitangaben-einordnen` | ✓ | ✓ | ✓ | ✓ | ✓ 1 source, unchanged | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `woher-logisticid-magazine-seine-informationen-bezieht` | ✓ | ✓ | ✓ | ✓ | n/a — no sources | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `willkommen-bei-logisticid-magazine` | ✓ | ✓ | ✓ | ✓ | n/a — no sources | ✓ | ✓ | ✓ | ✓ | ✓ | no hero (as English) |

## German slugs, frozen

The slug policy is the main site's, unchanged: lowercase ASCII, hyphenated,
`ä ö ü → ae oe ue`, `ß → ss`, no year. None of the five German slugs needed a
transliteration, which is a coincidence rather than a rule.

`welche-angaben-eine-frachtanfrage-beantwortbar-machen` was published in Phase
4S-A and is treated as public: it is unchanged, and any future change to it
needs a redirect, not an edit.

## Terminology

The main site's German glossary governs. The Magazine adds no vocabulary of its
own and contradicts none of the main site's definitions.

| English | German | Note |
| --- | --- | --- |
| freight forwarder | Spedition / Spediteur | § 453 HGB. What LogisticID is. |
| carrier | Transportunternehmen | The company that moves the goods. |
| — | Frachtführer | § 407 HGB. **Does not appear anywhere in the German corpus.** Nothing in these five articles needs the role, and using it loosely is the one German word that changes what LogisticID is claiming to be. |
| shipper | Versender | |
| full truckload / FTL | Komplettladung (FTL) | |
| part load / LTL | Teilladung (LTL) | Not `Stückgut`, which is the hub-routed product. |
| express | Expressfracht | |
| pallet freight | Palettenversand | |
| groupage | Sammelgut | |
| consignment | Sendung | |
| equipment | Equipment | Unchanged, as on the main site. |
| curtainsider | Planenauflieger | |
| transit time | Laufzeit | |
| handling | Umschlag | |
| customs broker | Zollvertreter | |
| dangerous-goods safety adviser | Gefahrgutbeauftragter | ADR 1.8.3. |
| own-account transport | Werkverkehr | |
| cabotage / cross-trade | Kabotage / Drittlandverkehr | Eurostat's own categories. |

## Citations: what is translated and what is not

The line is **data versus commentary**, and it is the line the main site's
Phase 4S-B5 found easiest to cross by accident.

**Never translated.** A source's title, its author or issuing body, its
publication, its report number, its date, its DOI and the date a person opened
it. The Eurostat article is cited in the German piece as *Road freight
transport statistics*, Eurostat, *Statistics Explained*, accessed 2026-09-01 —
exactly as in the English one. A translated source title is a title nobody
published, and a reader who takes it to the register will not find it.
Photographers' names and licence identifiers are the same rule.

**Translated.** The kind of source (`Amtliche Statistik`), the word
"Abgerufen am", the note that only an abstract was read, the heading
"Quellen", the alt text, and `"less than truckload"` — kept in quotation marks
as the English expansion of LTL, exactly as the English article gives it.

**Numbers keep their digits and change their separators.** `13.3 billion
tonnes` → `13,3 Milliarden Tonnen`; `1 886 billion tonne-kilometres` → `1 886
Milliarden Tonnenkilometer`. Nothing was rounded, converted or added.

## What the audit found, in rendered HTML, through the proxy

Every defect below was invisible in the source that produced it and in every
test that existed. They were found by building for production, serving the
Magazine behind the main site's rewrite, and reading what came back.

1. **The language control was a 404 on every page, in both languages.** The
   switcher is a plain anchor and `basePath` is a `next/link` feature, so
   `/de/korrekturen` asked the MAIN application for `logisticid.com/de/korrekturen`.
   Live since 4S-A. Every test asserted the cluster, which was always right.
2. **`Where this stops and a professional starts`** printed three times on the
   live German pilot article — the single most important sentence in a freight
   article, in a language the reader had not chosen.
3. **`Reference 1` and `Table`** announced to a screen reader on every German
   article. Visible to nobody who can see.
4. **The structured data named an image that 404s.** The hero URL went through
   `magazineUrl`, which adds the base path; the `<img>` beside it did not. The
   page was right and the machine-readable copy of it was wrong.
5. **The 404 was neither page we wrote.** With two root layouts in route
   groups, Next.js applies a route-group `not-found`'s metadata and then serves
   its own error document. Every missing Magazine URL returned a page with no
   `lang`, no landmark and one line of English — at a genuine 404 status, which
   is why the routing validator passed it for four phases.
6. **The way out of the German Magazine went to the English home**, on every
   German page.
7. **Three quotations in the live pilot article opened with `„` and closed with
   a straight ASCII `"`.** Balanced to a spell-checker, wrong to any German
   reader.
8. **`min read`, `References`, `Accessed`, the source-type labels and every
   section name** were English on German pages, all from strings written inline
   in a component instead of in the dictionary.

## The bilingual 404

`src/app/not-found.tsx` answers in both languages, each half marked with its
own `lang`. It sits outside both root layouts and cannot know which language
the reader was reading. The three ways to give it one are all worse: reading
the pathname makes every public route dynamic, `Accept-Language` is forbidden
by the localization doctrine and wrong on its own terms, and defaulting to
English would hand a German reader an English page at a German address.

## Feeds

One feed per language, not one feed with a language per item. A feed is a
subscription: a reader who subscribed to the German feed has said which
language they read.

```
/magazine/rss.xml        /magazine/de/rss.xml
/magazine/atom.xml       /magazine/de/atom.xml
/magazine/feed.json      /magazine/de/feed.json
/magazine/latest.json    /magazine/de/latest.json
/magazine/search-index.json  /magazine/de/search-index.json
```

`latest.json` is the contract the main site may consume. Its `version` is
unchanged at 1 — the added `locale` field is additive, and the `href` fix is a
correction: it used to compose an English path for a German article.

## Verification

Through the main site's rewrite, against a production build of both
applications:

- sitemap 30 URLs — 15 English, 15 German — all 200;
- 0 canonical mismatches, 0 `lang` failures, 0 missing `h1`, 0 noindex pages in
  the sitemap, 0 infrastructure-hostname leaks;
- 0 duplicate titles, 0 duplicate descriptions;
- 30 pages advertise alternates, **all reciprocal**, `x-default` on all;
- 10 `Article` nodes: `inLanguage`, `url`, `mainEntityOfPage`, `headline` and
  `description` all agree with the page and its canonical;
- 59 distinct internal link targets probed, **0 broken**;
- link graph: German → German Magazine 311, German → German main site 117,
  German → English main site **0**, German → English Magazine 15 (the language
  switcher, one per German page, which is required);
- 32 served routes and 17 genuine 404s asserted against the running server,
  including an English slug under `/de/`, a German slug under an English path
  and `/de/magazine/*`;
- 0 horizontal overflow at 390, 768, 1024 and 1440 on 19 pages; 0 accessibility
  findings on the same set;
- English pages: 18 before, 18 after, none added or removed. 14 gained exactly
  the language switcher and its `hreflang` cluster; the 404 was replaced
  deliberately; `/search` is byte-identical.

## Carried forward

- **No human German review.** See the top of this document.
- **No Open Graph image route.** The Magazine generates no card image in either
  language; articles now carry their hero photograph as `og:image`, and pages
  without one declare `summary` rather than `summary_large_image`. A generated
  card is a separate piece of work.
- **Section slugs stay English in German paths.** `/magazine/de/road-freight/…`.
  Translating them is a taxonomy decision for all sections at once, and it
  moves published URLs.
- **The corrections page calls `updateHistory` "substantive updates"** while the
  editorial policy files typographic fixes there. The German quotation-mark
  correction is recorded here rather than misfiled as a substantive update; the
  labelling tension is an English editorial question, older than this phase.
- **The German header on the main site does not link the Magazine.** Only the
  footer does. The English header does. Adding it means changing
  `localizedNavigation()`, which is a main-site information-architecture
  decision rather than a Magazine link fix.
