# Magazine localization

> How the Magazine publishes in more than one language. Settled in Phase 4S-A
> alongside the main site, and deliberately consistent with it — see
> `docs/localization/locales.md`, which both repositories hold byte-for-byte
> and both test themselves against.

## URLs

```
/magazine/                              English index
/magazine/{section}/                    English section
/magazine/{section}/{slug}              English article
/magazine/de/                           German index
/magazine/de/{section}/                 German section
/magazine/de/{section}/{german-slug}    German article
```

German stays **under** `/magazine/`, not at `/de/magazine/`. The main
application owns `/magazine/*` and rewrites the whole subtree to this service
over Railway's private network. A second public prefix would mean a second
rewrite rule, a second thing to keep in step with the hosting, and a change to
a routing contract that works.

`/magazine/de` and the `[section]` route could both match that URL. They do not
collide because a literal segment outranks a dynamic one, and because no
section may be slugged `de` — `tests/content/localization.test.ts` asserts it,
since a section that claimed it would be resolved by router precedence rather
than by anybody's decision.

**Section slugs are not translated.** `road-freight` stays `road-freight` in
the German path. Section identity is language-neutral, and translating the slug
is a decision about the taxonomy taken once for all sections — worth making
when there are enough German articles for the sections to be worth naming in
German, and not before. The article's own slug is what a reader reads, and that
is German.

## Two root layouts

The app tree is split into `(en)` and `(de)` route groups for the same reason
the main site's is: `<html lang="de">` can only be written by a root layout, and
a layout cannot read the pathname without becoming dynamic. A route group
contributes no URL segment, so every English Magazine URL is exactly where it
was.

Each group carries a catch-all that calls `notFound()`, because a URL matching
no route has no layout to be composed into and Next would otherwise serve its
own bare error document in place of the Magazine's 404.

## Language lives on the article

```json
{ "locale": "de", "translationOf": "what-information-makes-a-road-freight-quote-request-actionable" }
```

`locale` **defaults to English**, so every article written before the Magazine
had a second language keeps its meaning without being edited.

`translationOf` is **explicit, and recorded once, on the translation**. Pairing
could not be derived — a German article's slug is German, so no rule over slugs
would find its English counterpart — and guessing would produce an `hreflang`
pointing at whatever happened to look similar. Declaring it on either end would
let two articles claim the same edge and disagree; the loader refuses it on a
default-locale article, and the corpus validator refuses two translations
claiming one source.

An article with no counterpart advertises **no alternates at all**. That is what
lets the Magazine publish a single German article without every English article
claiming a German version.

## What is filtered by language, and what is not

| Surface | Language |
| --- | --- |
| Index, section pages, article pages | one language each |
| Header and footer navigation | sections that have something in that language |
| RSS, Atom, JSON Feed, `latest.json` | **English only** |
| Search index and `/search` | **English only** |
| Sitemap | **both** |
| Related reading | same language as the article |

`publicArticles()` defaults to English, and that default is why no existing
caller had to change: the feeds, the search index, the corrections list and the
author pages all became locale-correct without an edit, rather than each having
to remember to filter — which is the version somebody forgets.

**Feeds stay in one language.** Mixing them would deliver German editorial to a
subscriber who signed up for English. A German feed is created when there is
enough German to fill one; one article is not a publication schedule.

**The sitemap carries both**, because it is a discovery document rather than a
subscription, and because a German article that no sitemap lists is a German
article no crawler finds.

## Structured data

`inLanguage` and `url` come from the article, not from the publication default.
Both were wrong in the first implementation and both were caught by looking at
the served page rather than at the code: the German article declared
`inLanguage: "en"`, and its `url` named an English path that returns 404 while
the page's own canonical named the German one. Two identities for one page, one
of them broken, and nothing in the build said so. `tests/content/localization.test.ts`
now asserts both against every article in the corpus.

The `publisher` node is identical in both languages. There is one company, and
it does not acquire a second legal identity by being described in German.

## What is not done

- **No German feed.** See above.
- **No German search.** The index covers the English corpus; the German header
  offers search as an English destination rather than presenting it as a German
  feature.
- **No translated policy pages.** The editorial, sourcing and image policies
  are English, linked from the German footer with `lang="en"` and a German
  sentence saying so.
- **No German author pages.** The byline links to the English author page,
  marked `lang="en"`.
- **One German article.** Phase 4S-A proves the architecture end to end; it
  does not build a German editorial corpus.

## Adding a German article

1. Write it in `content/articles/`, with `"locale": "de"` and — if it
   translates an existing piece — `"translationOf"` naming that article's id.
2. Give it a German slug. Do not translate the section slug.
3. Run the test suite. The corpus validator checks the pairing, and the
   localization guards check the URL, the hreflang cluster and the schema.

The German section index and the German header entry appear on their own, from
the article's existence. Nothing else needs editing.
