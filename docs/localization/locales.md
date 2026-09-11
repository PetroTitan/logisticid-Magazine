# Locales

> The canonical locale record, shared byte-for-byte between the main site and
> the Magazine. Both repositories hold an identical copy and both run a test
> that fails if their own locale model disagrees with it.

## Why this file exists

The two applications serve one hostname. A reader crossing from
`logisticid.com/de/strassengueterverkehr` into
`logisticid.com/magazine/de/…` is in one language on one website, and nothing
in either build forces the two to agree about what "de" means.

The failure would be quiet and it would be acted on. A `de-DE` in one
application and a `de` in the other tells a search engine that half the German
content targets Germany specifically and half does not. A different path prefix
in one of them produces a language switcher that leaves the language. Neither
breaks a build.

There is no shared package, deliberately: the two deployments are independent
and neither needs the other present to build. The shared artefact is this
document, and each repository proves its own configuration against it — the
same mechanism `docs/company/corporate-identity.md` uses for the company.

## Canonical values

```
locales = en,de,ru
default_locale = en
en_hreflang = en
en_path_prefix =
en_native_label = English
de_hreflang = de
de_path_prefix = /de
de_native_label = Deutsch
de_formatting_locale = de-DE
ru_hreflang = ru
ru_path_prefix = /ru
ru_native_label = Русский
ru_formatting_locale = ru-RU
```

## Decisions behind these values

### `hreflang` is a bare language subtag, not a language-region pair

`de`, not `de-DE`. A language-region pair tells a search engine the content is
for that country specifically, and the German pages describe European road
freight for Austria and Switzerland as readily as for Germany. Claiming a
region the content does not target is a worse error than claiming none.

`de_formatting_locale` is `de-DE` because number and date formatting has to
pick a convention and that is the majority one. It is a presentation choice and
it is deliberately not the same value as the `hreflang`.

For Russian the same rule is load-bearing rather than tidy. `ru-RU` would tell
a search engine this content targets Russia. It does not: LogisticID arranges
European road freight and serves no Russian market, and the Russian pages exist
for Russian-speaking carriers, dispatchers and shippers wherever they work —
the Baltics, Central Asia, Poland, Germany. `hreflang="ru"` says "in Russian",
which is the only thing the language layer is entitled to say.

`ru_formatting_locale` is `ru-RU` for the same presentational reason `de-DE`
is, and `openGraphLocale` is `ru_RU` because Open Graph's grammar is
`language_TERRITORY` and offers no territory-neutral form. Neither is read by
anything that decides availability.

### English has an empty prefix

English predates the second language by the whole life of both applications and
owns URLs that are indexed and linked. Serving it from `/en/` would be a
site-wide redirect wave bought with nothing but symmetry. The asymmetry is
confined to the prefix; nothing else branches on which locale is the default.

### The prefix is relative to each application's own base

On the main site `/de` is an absolute path. In the Magazine it sits inside the
`/magazine` base path, so the same prefix produces `/magazine/de`. The Magazine
is **not** moved to `/de/magazine`: the main application owns `/magazine/*` and
rewrites the whole subtree to the Magazine service, and a second public prefix
would mean a second rewrite rule and a change to a routing contract that works.

### A locale code is a reserved segment in both applications

`/de` belongs to German and `/ru` to Russian. The main site may not publish an
English route beginning with either, and the Magazine may not register a
section slugged `de` or `ru` — either would occupy the same URL as a whole
language tree, and the router would resolve it by precedence rather than by
anybody's decision. Both repositories assert this.

### The language layer is not a market

This is a content rule, and it is recorded here because it is the rule most
easily lost when a locale is added by somebody reading only the code. A locale
prefix says which language a document is written in. It says nothing about
where the company arranges freight, and the service, market and corridor truth
on a page in any language is the same registry truth every other language
reads. `/ru/` does not make Russia, Belarus, the CIS or the EAEU a served
geography, and no page may acquire a market, a service, a guarantee or a
capability by being translated.

## Adding a locale

Add it here first, then in both repositories. A locale with no translated route
or article contributes no URL and no alternate in either application, so adding
one cannot publish an empty shell — but the two must learn about it together,
or the language switcher in one will offer a language the other does not serve.
