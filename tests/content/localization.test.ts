import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  defaultLocale,
  localeDetails,
  locales,
  reservedSectionSlugs,
  type Locale,
} from "@/config/locales";
import { uiStrings } from "@/config/ui-strings";
import {
  loadArticles,
  parseArticleFile,
  publishedArticles,
  validateCorpus,
} from "@/content/load";
import { sections } from "@/content/sections";
import type { Article } from "@/content/types";
import { articleJsonLd } from "@/lib/jsonld";
import {
  articleAlternates,
  articleCluster,
  articlePath,
  indexPath,
  populatedLocales,
  sectionPath,
} from "@/lib/localized-routes";
import { rssFeed, sitemapXml, articleUrl } from "@/lib/feeds";

/**
 * Guards on the Magazine's localization.
 *
 * They protect the architecture, not the German. No test here can tell whether
 * a translated article reads well — that needs a native-level German speaker
 * with freight knowledge, and `docs/localization/de/style-guide.md` in the main
 * repository says so. What these prove is that a URL means one language, that
 * a translation is either paired or absent, and that no page, feed or schema
 * claims a language it is not written in.
 */

const ROOT = process.cwd();
const corpus = publishedArticles(loadArticles());

/** The canonical locale block, parsed from the record both repositories hold. */
function canonicalLocales(): Readonly<Record<string, string>> {
  const document = readFileSync(join(ROOT, "docs/localization/locales.md"), "utf8");
  const block = /```\n([\s\S]*?)```/.exec(document);
  expect(block, "no canonical block in docs/localization/locales.md").not.toBeNull();
  return Object.fromEntries(
    (block as RegExpExecArray)[1]!
      .split("\n")
      .filter((line) => line.includes("="))
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at).trim(), line.slice(at + 1).trim()] as const;
      }),
  );
}

const canonical = canonicalLocales();

describe("locale parity with the main site", () => {
  it("agrees with the shared record on every value", () => {
    // The failure this prevents is silent in both applications: a `de-DE` here
    // and a `de` there would tell a search engine that half the German content
    // targets Germany specifically. Nothing would break.
    expect(locales.join(",")).toBe(canonical["locales"]);
    expect(defaultLocale).toBe(canonical["default_locale"]);
    expect(localeDetails.en.hreflang).toBe(canonical["en_hreflang"]);
    expect(localeDetails.en.pathPrefix).toBe(canonical["en_path_prefix"] ?? "");
    expect(localeDetails.en.nativeLabel).toBe(canonical["en_native_label"]);
    expect(localeDetails.de.hreflang).toBe(canonical["de_hreflang"]);
    expect(localeDetails.de.pathPrefix).toBe(canonical["de_path_prefix"]);
    expect(localeDetails.de.nativeLabel).toBe(canonical["de_native_label"]);
    expect(localeDetails.de.formattingLocale).toBe(canonical["de_formatting_locale"]);
  });

  it("uses a bare language subtag for hreflang", () => {
    // `de-DE` would claim the content targets Germany specifically. It does not.
    for (const locale of locales) {
      expect(localeDetails[locale].hreflang, locale).toMatch(/^[a-z]{2}$/);
    }
  });

  it("keeps the German prefix inside the Magazine's base path", () => {
    // `/magazine/de`, never `/de/magazine`. The main application rewrites the
    // whole `/magazine/*` subtree to this service; a second public prefix would
    // be a change to a routing contract that works.
    expect(indexPath("de")).toBe("/de");
    expect(indexPath("en")).toBe("/");
    expect(sectionPath("road-freight", "de")).toBe("/de/road-freight");
  });
});

describe("the locale segment is reserved", () => {
  it("is claimed by no section", () => {
    // A section slugged `de` would occupy the same URL as the whole German
    // tree, and the router would decide by precedence rather than by anyone's
    // decision.
    for (const section of sections) {
      expect(reservedSectionSlugs, `section "${section.slug}" claims a locale segment`)
        .not.toContain(section.slug);
    }
  });

  it("is claimed by no article slug at the top level", () => {
    for (const article of corpus) {
      expect(reservedSectionSlugs).not.toContain(article.slug);
    }
  });
});

describe("the corpus", () => {
  it("gives every article a locale", () => {
    for (const article of corpus) {
      expect(locales as readonly string[], article.id).toContain(article.locale);
    }
  });

  it("defaults an article with no declared locale to the default", () => {
    // Every article written before the Magazine had a second language keeps
    // its meaning without being edited.
    const files = readdirSync(join(ROOT, "content/articles"));
    const undeclared = files.filter(
      (file) => !readFileSync(join(ROOT, "content/articles", file), "utf8").includes('"locale"'),
    );
    expect(undeclared.length, "no article exercises the default").toBeGreaterThan(0);
    for (const file of undeclared) {
      const id = file.replace(/\.md$/, "");
      const article = corpus.find((candidate) => candidate.id === id);
      if (article === undefined) continue;
      expect(article.locale, id).toBe(defaultLocale);
    }
  });

  it("rejects a translation of an article that does not exist", () => {
    const [first] = corpus;
    expect(first).toBeDefined();
    const broken: Article = {
      ...(first as Article),
      id: "broken",
      slug: "broken",
      locale: "de",
      translationOf: "no-such-article",
    };
    expect(() => validateCorpus([...corpus, broken])).toThrow(/does not exist/);
  });

  it("rejects two translations claiming the same source", () => {
    const german = corpus.find((article) => article.translationOf !== undefined);
    expect(german, "the corpus has no translated article to test with").toBeDefined();
    const duplicate: Article = {
      ...(german as Article),
      id: "duplicate",
      slug: "duplicate",
    };
    expect(() => validateCorpus([...corpus, duplicate])).toThrow(/both claim to be/);
  });

  it("rejects a pairing between two articles in the same language", () => {
    const english = corpus.find((article) => article.locale === defaultLocale);
    expect(english).toBeDefined();
    const broken: Article = {
      ...(english as Article),
      id: "same-language",
      slug: "same-language",
      locale: defaultLocale,
      translationOf: (english as Article).id,
    };
    expect(() => validateCorpus([...corpus, broken])).toThrow(/same language/);
  });

  it("refuses translationOf on a default-locale article at parse time", () => {
    /**
     * The pairing is recorded ONCE, on the translation. Allowing it on either
     * end would let two articles declare the same edge and disagree about it,
     * and the loser would be whichever the corpus happened to reach second.
     *
     * Asserted against the parser rather than the corpus validator, because
     * that is the layer that owns the rule — the first version of this test
     * asked `validateCorpus` and passed for the wrong reason.
     */
    const source = corpus.find((article) => article.locale !== defaultLocale);
    expect(source).toBeDefined();
    const frontmatter = JSON.stringify({
      id: "en-with-translation-of",
      slug: "en-with-translation-of",
      section: (source as Article).section,
      locale: defaultLocale,
      translationOf: (source as Article).id,
      title: "t",
      subtitle: "s",
      description: "d",
      summary: "s",
      tags: [],
      authors: ["logisticid-editorial-team"],
      datePublished: "2026-09-01",
      status: "PUBLISHED",
      schemaType: "Article",
      relatedLogisticID: [],
      relatedArticles: [],
    });
    expect(() =>
      parseArticleFile(
        "en-with-translation-of.md",
        `---\n${frontmatter}\n---\n\nBody.\n`,
        "2026-09-10",
      ),
    ).toThrow(/translationOf is set on a en article/);
  });
});

describe("URLs carry the locale", () => {
  it("puts every German article under the German prefix", () => {
    for (const article of corpus) {
      const path = articlePath(article);
      if (article.locale === defaultLocale) {
        expect(path.startsWith("/de/"), article.id).toBe(false);
      } else {
        expect(path.startsWith(`${localeDetails[article.locale].pathPrefix}/`), article.id)
          .toBe(true);
      }
    }
  });

  it("never gives two articles the same URL", () => {
    const paths = corpus.map((article) => articlePath(article));
    expect(new Set(paths).size, `collision among ${paths.join(", ")}`).toBe(paths.length);
  });

  it("uses the locale-aware path in feeds and the sitemap", () => {
    // Built from section and slug alone, a German article's feed and sitemap
    // URL would be an English path that 404s.
    for (const article of corpus) {
      expect(articleUrl(article)).toContain(articlePath(article));
    }
  });
});

describe("hreflang", () => {
  it("is reciprocal, or absent", () => {
    for (const article of corpus) {
      const cluster = articleCluster(article, corpus);
      if (Object.keys(cluster).length === 0) {
        expect(articleAlternates(article, corpus), article.id).toBeUndefined();
        continue;
      }
      // Every member of a cluster produces the same cluster.
      for (const member of Object.values(cluster)) {
        expect(articleCluster(member, corpus), `${article.id} vs ${member.id}`).toEqual(
          cluster,
        );
      }
    }
  });

  it("names only articles that exist", () => {
    const known = new Set(corpus.map((article) => articleUrl(article)));
    for (const article of corpus) {
      const languages = articleAlternates(article, corpus);
      if (languages === undefined) continue;
      for (const [key, url] of Object.entries(languages)) {
        if (key === "x-default") continue;
        expect(known.has(url), `${article.id} points at unknown ${url}`).toBe(true);
      }
    }
  });

  it("gives an untranslated article no alternates at all", () => {
    const lonely = corpus.filter(
      (article) =>
        article.translationOf === undefined &&
        !corpus.some((other) => other.translationOf === article.id),
    );
    expect(lonely.length, "every article is translated — nothing to test").toBeGreaterThan(0);
    for (const article of lonely) {
      expect(articleAlternates(article, corpus), article.id).toBeUndefined();
    }
  });

  it("names the default locale as x-default", () => {
    const translated = corpus.filter((article) => article.translationOf !== undefined);
    expect(translated.length).toBeGreaterThan(0);
    for (const article of translated) {
      const languages = articleAlternates(article, corpus) as Record<string, string>;
      expect(languages["x-default"]).toBe(languages[localeDetails[defaultLocale].hreflang]);
    }
  });
});

describe("structured data states the article's own language", () => {
  it("emits inLanguage from the article, not the publication default", () => {
    // Measured: composed from the site default, the German article's schema
    // declared `en` — the one thing the localization exists to state correctly.
    for (const article of corpus) {
      expect(articleJsonLd(article)["inLanguage"], article.id).toBe(
        localeDetails[article.locale].hreflang,
      );
    }
  });

  it("emits a url that matches the page's own canonical", () => {
    // Measured: the German article's schema named an English path that returns
    // 404, while its canonical named the German one. Two identities for one
    // page, one of them broken.
    for (const article of corpus) {
      expect(articleJsonLd(article)["url"], article.id).toBe(articleUrl(article));
    }
  });

  it("names the same publisher in every language", () => {
    for (const article of corpus) {
      const node = articleJsonLd(article)["publisher"] as Record<string, unknown>;
      expect(node["legalName"], article.id).toBe("LogisticID s.r.o.");
    }
  });
});

describe("feeds stay in one language", () => {
  it("lists no German article in the English feed", () => {
    // §83: mixing languages into one feed would deliver German editorial to a
    // subscriber who signed up for English. The German corpus is one article;
    // a German feed is created when there is something to fill it.
    const english = corpus.filter((article) => article.locale === defaultLocale);
    const feed = rssFeed(english);
    for (const article of corpus) {
      if (article.locale === defaultLocale) continue;
      expect(feed, `the English feed carries ${article.id}`).not.toContain(article.slug);
    }
  });

  it("lists every language in the sitemap", () => {
    // The sitemap is the one place both languages belong: it is a discovery
    // document, not a subscription.
    const xml = sitemapXml(corpus.map((article) => ({ loc: articleUrl(article) })));
    for (const article of corpus) {
      expect(xml, `${article.id} is missing from the sitemap`).toContain(articleUrl(article));
    }
  });
});

describe("translation completeness", () => {
  it("translates every interface string into every locale", () => {
    const englishKeys = Object.keys(uiStrings.en).sort();
    for (const locale of locales) {
      expect(Object.keys(uiStrings[locale]).sort(), locale).toEqual(englishKeys);
    }
    for (const [key, value] of Object.entries(uiStrings.de)) {
      if (key === "readInEnglishNote") continue;
      expect(value, `de.${key} is empty`).not.toBe("");
    }
  });

  it("ships a German shell only where German articles exist", () => {
    // An indexable German index listing nothing would be a thin page in a
    // language the publication does not yet publish in.
    const populated = populatedLocales(corpus);
    for (const locale of locales) {
      const has = corpus.some((article) => article.locale === locale);
      expect(populated.includes(locale as Locale), locale).toBe(has);
    }
  });

  it("keeps the German tree free of imports from the English tree", () => {
    // The only way an English page body could reach a German URL with a 200.
    const base = join(ROOT, "src", "app", "(de)");
    const walk = (directory: string): string[] =>
      existsSync(directory)
        ? readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
            const path = join(directory, entry.name);
            return entry.isDirectory() ? walk(path) : [path];
          })
        : [];
    const files = walk(base);
    expect(files.length, "no German files found at all").toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toContain("@/app/(en)/");
    }
  });
});
