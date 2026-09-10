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
locales = en,de
default_locale = en
en_hreflang = en
en_path_prefix =
en_native_label = English
de_hreflang = de
de_path_prefix = /de
de_native_label = Deutsch
de_formatting_locale = de-DE
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

`/de` belongs to German. The main site may not publish an English route
beginning `/de/`, and the Magazine may not register a section slugged `de` —
either would occupy the same URL as the whole German tree, and the router would
resolve it by precedence rather than by anybody's decision. Both repositories
assert this.

## Adding a locale

Add it here first, then in both repositories. A locale with no translated route
or article contributes no URL and no alternate in either application, so adding
one cannot publish an empty shell — but the two must learn about it together,
or the language switcher in one will offer a language the other does not serve.
