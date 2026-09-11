import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { locales, type Locale } from "@/config/locales";
import { uiStrings } from "@/config/ui-strings";
import { authorLabels, authors } from "@/content/authors";
import { loadArticles, publishedArticles } from "@/content/load";
import { blocksToText } from "@/content/markdown";
import { getSection, sectionLabels, sections } from "@/content/sections";
import type { Article } from "@/content/types";
import { articleJsonLd } from "@/lib/jsonld";
import { atomFeed, jsonFeed, rssFeed, articleUrl } from "@/lib/feeds";
import {
  articlePath,
  authorPath,
  magazineStaticRoutes,
  staticPath,
  type MagazineStaticRoute,
} from "@/lib/localized-routes";
import { buildSearchIndex } from "@/lib/search";
import { magazineUrl } from "@/lib/site";

/**
 * The German edition, as a whole.
 *
 * `tests/content/localization.test.ts` guards the ARCHITECTURE — that a URL
 * means one language and a translation is paired or absent. This file guards
 * the EDITION: that it is complete, that every surface a German reader can
 * reach is German, and that nothing describes a German page in English to a
 * machine.
 *
 * None of it can tell whether the German reads well. That needs a native-level
 * German speaker with freight knowledge, and no such review has taken place —
 * see `docs/localization/de/magazine-editorial-review.md`.
 */

const corpus = publishedArticles(loadArticles());
const german = corpus.filter((article) => article.locale === "de");
const english = corpus.filter((article) => article.locale === "en");

/**
 * THE GUARD ON THE GUARD.
 *
 * Every assertion below loops over `german`. A bug that emptied that list
 * would turn this whole file green while proving nothing, which is the failure
 * mode that hides everything else — the main site's Phase 4S-B4 suite failed
 * exactly this way on its first run, claiming 52 pages and rendering 47.
 */
describe("the suite examines the corpus it claims to", () => {
  it("found German articles, and found them by reading the content directory", () => {
    const files = readdirSync(join(process.cwd(), "content", "articles")).filter((name) =>
      name.endsWith(".md"),
    );
    expect(files.length).toBeGreaterThan(0);
    expect(corpus.length).toBe(files.length);
    expect(german.length).toBeGreaterThan(0);
    expect(english.length).toBeGreaterThan(0);
  });
});

describe("article parity", () => {
  it("every English article has a German translation", () => {
    const missing = english.filter(
      (article) => !german.some((translation) => translation.translationOf === article.id),
    );
    expect(missing.map((a) => a.id)).toEqual([]);
    expect(german.length).toBe(english.length);
  });

  it("every German article names the English article it translates", () => {
    for (const article of german) {
      expect(article.translationOf, article.id).toBeDefined();
      expect(
        english.some((source) => source.id === article.translationOf),
        `${article.id} → ${article.translationOf}`,
      ).toBe(true);
    }
  });

  it("a German article keeps its own slug and its own URL", () => {
    for (const article of german) {
      const source = english.find((candidate) => candidate.id === article.translationOf) as Article;
      expect(article.slug, article.id).not.toBe(source.slug);
      expect(articlePath(article), article.id).toBe(`/de/${article.section}/${article.slug}`);
    }
  });

  it("German slugs follow the site-wide URL policy", () => {
    for (const article of german) {
      // Lowercase ASCII, hyphenated, no umlauts and no ß — the same policy the
      // main site applies to `/de/strassengueterverkehr`. A slug is an address,
      // not prose, and an address that needs a keyboard layout is a bad one.
      expect(article.slug, article.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(article.slug, article.id).not.toMatch(/[äöüß]/);
    }
  });

  it("a German article's related reading resolves to German", () => {
    for (const article of german) {
      for (const related of article.relatedArticles) {
        const target = corpus.find((candidate) => candidate.id === related);
        expect(target, `${article.id} → ${related}`).toBeDefined();
        expect((target as Article).locale, `${article.id} → ${related}`).toBe("de");
      }
    }
  });
});

describe("article identity in structured data", () => {
  it("declares German, at the German URL, with the German headline", () => {
    for (const article of german) {
      const node = articleJsonLd(article);
      const canonical = magazineUrl(articlePath(article)).href;

      expect(node["inLanguage"], article.id).toBe("de");
      expect(node["url"], article.id).toBe(canonical);
      expect((node["mainEntityOfPage"] as Record<string, unknown>)["@id"], article.id).toBe(
        canonical,
      );
      expect(node["headline"], article.id).toBe(article.title);
      expect(node["description"], article.id).toBe(article.description);
      expect(node["datePublished"], article.id).toBe(article.datePublished);
    }
  });

  it("names the German author page and the German section", () => {
    for (const article of german) {
      const author = (node: Record<string, unknown>) =>
        (node["author"] as Record<string, unknown>[])[0] as Record<string, unknown>;
      const node = articleJsonLd(article);
      const first = author(node);
      expect(first["url"], article.id).toBe(
        magazineUrl(authorPath(article.authors[0] as string, "de")).href,
      );
      const section = getSection(article.section);
      expect(node["articleSection"], article.id).toBe(
        sectionLabels(section as NonNullable<typeof section>, "de").name,
      );
    }
  });

  it("keeps the publisher as the one canonical entity in both languages", () => {
    for (const article of corpus) {
      const publisher = articleJsonLd(article)["publisher"] as Record<string, unknown>;
      // No German legal entity fork. `LogisticID s.r.o.` is an entry in the
      // Prague Commercial Register, not a string with a translation, and a
      // `LogisticID GmbH` would be a company that does not exist.
      expect(publisher["legalName"], article.id).toBe("LogisticID s.r.o.");
      expect(JSON.stringify(publisher), article.id).not.toMatch(/GmbH|AG\b|S\.A\./);
    }
  });

  it("never emits an English URL for a German article, anywhere", () => {
    const englishPaths = english.map((article) => `/magazine/${article.section}/${article.slug}`);
    for (const article of german) {
      const serialised = JSON.stringify(articleJsonLd(article));
      for (const path of englishPaths) {
        expect(serialised.includes(path), `${article.id} names ${path}`).toBe(false);
      }
    }
  });
});

describe("the German surfaces a reader can reach", () => {
  it("gives every static route a path in every language", () => {
    const keys = Object.keys(magazineStaticRoutes) as MagazineStaticRoute[];
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      for (const locale of locales) {
        const path = staticPath(key, locale);
        expect(path, `${key}/${locale}`).toMatch(/^\//);
        if (locale === "de") {
          expect(path, key).toMatch(/^\/de(\/|$)/);
          expect(path, key).not.toMatch(/[äöüßA-Z]/);
        } else {
          expect(path, key).not.toMatch(/^\/de(\/|$)/);
        }
      }
    }
  });

  it("has a route file behind every German static route", () => {
    const appDir = join(process.cwd(), "src", "app", "(de)");
    const present = new Set<string>();
    const walk = (dir: string, prefix: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          walk(join(dir, entry.name), entry.name.startsWith("(") ? prefix : `${prefix}/${entry.name}`);
        } else if (entry.name === "page.tsx" || entry.name === "route.ts") {
          present.add(prefix === "" ? "/" : prefix);
        }
      }
    };
    walk(appDir, "");

    for (const key of Object.keys(magazineStaticRoutes) as MagazineStaticRoute[]) {
      expect(present.has(staticPath(key, "de")), `${key} → ${staticPath(key, "de")}`).toBe(true);
    }
  });

  it("names every section and every byline in every language", () => {
    for (const locale of locales) {
      const names = new Set<string>();
      for (const section of sections) {
        const labels = sectionLabels(section, locale);
        for (const value of Object.values(labels)) {
          expect(value.trim(), `${section.slug}/${locale}`).not.toBe("");
        }
        expect(names.has(labels.name), `duplicate section name ${labels.name}`).toBe(false);
        names.add(labels.name);
      }
      for (const author of authors) {
        const labels = authorLabels(author, locale);
        for (const value of Object.values(labels)) {
          expect(value.trim(), `${author.slug}/${locale}`).not.toBe("");
        }
      }
    }
  });

  it("gives the German section a German name, not the English one", () => {
    for (const section of sections) {
      expect(sectionLabels(section, "de").name, section.slug).not.toBe(
        sectionLabels(section, "en").name,
      );
    }
  });
});

describe("the interface dictionary", () => {
  /**
   * A German string identical to its English one is almost always an
   * untranslated string rather than a word that happens to be the same. The
   * exceptions are named, so adding one is a decision somebody records.
   */
  const SAME_IN_BOTH = new Set([
    "readInEnglishNote", // empty in both since the standards pages exist in German
    "correction", // Korrektur ≠ Correction, but the label is "Korrektur"
    "illustration", // Illustration is the German word
  ]);

  it("has no German value left at its English wording", () => {
    const untranslated: string[] = [];
    for (const [key, value] of Object.entries(uiStrings.de)) {
      if (SAME_IN_BOTH.has(key)) continue;
      const englishValue = (uiStrings.en as Record<string, unknown>)[key];
      if (typeof value === "string" && value === englishValue) untranslated.push(key);
      if (typeof value === "object" && value !== null) {
        for (const [inner, innerValue] of Object.entries(value as Record<string, string>)) {
          const englishInner = (englishValue as Record<string, string>)[inner];
          if (innerValue === englishInner) untranslated.push(`${key}.${inner}`);
        }
      }
    }
    expect(untranslated).toEqual([]);
  });

  it("uses German quotation marks in German", () => {
    /*
     * German quotes low-then-high: „so“. The opening mark is U+201E and the
     * closing mark is U+201C — which is the ENGLISH OPENING mark, so a naive
     * "no curly quotes in German" rule is wrong and this one nearly was.
     *
     * What is actually forbidden is U+201D, the English closing mark, which
     * has no role in German at all; and an unbalanced pair, which is what an
     * English string with one mark swapped looks like.
     */
    for (const [key, value] of Object.entries(uiStrings.de)) {
      if (typeof value !== "string") continue;
      expect(value.includes("”"), `${key} uses the English closing quote: ${value}`).toBe(false);
      const opens = (value.match(/„/g) ?? []).length;
      const closes = (value.match(/“/g) ?? []).length;
      expect(opens, `${key} has unbalanced German quotes: ${value}`).toBe(closes);
    }
  });

  it("uses German quotation marks in the German prose as well", () => {
    /*
     * MEASURED IN THE LIVE PILOT ARTICLE. It opened three quotations with „
     * and closed all three with a straight ASCII ". Balanced-looking to a
     * spell-checker, wrong to any German reader, and invisible in a diff of an
     * otherwise-German paragraph.
     */
    for (const article of german) {
      const text = [
        article.title,
        article.subtitle,
        article.description,
        article.summary,
        blocksToText(article.body),
      ].join(" ");
      expect(text.includes("”"), `${article.id} uses the English closing quote`).toBe(false);
      expect(
        text.includes('"'),
        `${article.id} closes or opens a quotation with a straight ASCII quote`,
      ).toBe(false);
      expect((text.match(/„/g) ?? []).length, `${article.id} has unbalanced quotes`).toBe(
        (text.match(/“/g) ?? []).length,
      );
    }
  });
});

describe("feeds and the search index", () => {
  const germanFeedArticles = german;

  it("puts only German articles, at German URLs, in the German feeds", () => {
    const rss = rssFeed(germanFeedArticles, "de");
    const atom = atomFeed(germanFeedArticles, "1970-01-01T00:00:00Z", "de");
    const json = JSON.stringify(jsonFeed(germanFeedArticles, "de"));

    expect(rss).toContain("<language>de</language>");
    expect(atom).toContain('xml:lang="de"');
    expect(JSON.parse(JSON.stringify(jsonFeed(germanFeedArticles, "de")))["language"]).toBe("de");

    for (const article of german) {
      for (const feed of [rss, atom, json]) expect(feed).toContain(articleUrl(article));
    }
    for (const article of english) {
      for (const feed of [rss, atom, json]) {
        expect(feed.includes(articleUrl(article)), `English ${article.id} in a German feed`).toBe(
          false,
        );
      }
    }
  });

  it("keeps the English feeds English", () => {
    const rss = rssFeed(english, "en");
    expect(rss).toContain("<language>en</language>");
    for (const article of german) {
      expect(rss.includes(articleUrl(article)), `German ${article.id} in the English feed`).toBe(
        false,
      );
    }
  });

  it("sends a German search result to a German URL", () => {
    const index = buildSearchIndex(german, "1970-01-01");
    expect(index.documents.length).toBe(german.length);
    for (const document of index.documents) {
      expect(document.locale, document.id).toBe("de");
      expect(document.href, document.id).toMatch(/^\/magazine\/de\//);
      const section = getSection(document.section);
      expect(document.sectionName, document.id).toBe(
        sectionLabels(section as NonNullable<typeof section>, "de").name,
      );
    }
  });
});

describe("German metadata is distinct", () => {
  const distinct = (locale: Locale, pick: (article: Article) => string) => {
    const values = corpus.filter((a) => a.locale === locale).map(pick);
    expect(new Set(values).size, `${locale}: ${values.join(" | ")}`).toBe(values.length);
  };

  it("has no duplicate German titles", () => distinct("de", (a) => a.seoTitle ?? a.title));
  it("has no duplicate German descriptions", () =>
    distinct("de", (a) => a.seoDescription ?? a.description));
  it("has no duplicate English titles", () => distinct("en", (a) => a.seoTitle ?? a.title));
  it("has no duplicate English descriptions", () =>
    distinct("en", (a) => a.seoDescription ?? a.description));

  it("does not reuse the English title or description on the German article", () => {
    for (const article of german) {
      const source = english.find((candidate) => candidate.id === article.translationOf) as Article;
      expect(article.title, article.id).not.toBe(source.title);
      expect(article.description, article.id).not.toBe(source.description);
      expect(article.subtitle, article.id).not.toBe(source.subtitle);
      expect(article.summary, article.id).not.toBe(source.summary);
      if (article.heroImage !== undefined && source.heroImage !== undefined) {
        // The same licensed file, a German description of it. Reusing the
        // English `alt` would leave a screen reader describing the picture in
        // a language the page is not written in.
        expect(article.heroImage.src, article.id).toBe(source.heroImage.src);
        expect(article.heroImage.alt, article.id).not.toBe(source.heroImage.alt);
        expect(article.heroImage.license, article.id).toBe(source.heroImage.license);
        expect(article.heroImage.creator, article.id).toBe(source.heroImage.creator);
      }
    }
  });
});

describe("source parity", () => {
  it("gives the German article exactly the sources of the English one, unchanged", () => {
    for (const article of german) {
      const source = english.find((candidate) => candidate.id === article.translationOf) as Article;
      expect(article.sources.map((s) => s.id), article.id).toEqual(
        source.sources.map((s) => s.id),
      );
      for (const [index, cited] of article.sources.entries()) {
        const original = source.sources[index] as NonNullable<(typeof source.sources)[number]>;
        /*
         * A SOURCE IS EVIDENCE, NOT PROSE. Its title, its issuing body, its
         * publication, its identifier and the date a person opened it are
         * reproduced exactly. A translated source title is a title nobody
         * published, and a reader who takes it to the register will not find
         * it.
         */
        expect(cited.title, `${article.id}/${cited.id}`).toBe(original.title);
        expect(cited.authorsOrOrganization, `${article.id}/${cited.id}`).toBe(
          original.authorsOrOrganization,
        );
        expect(cited.publication, `${article.id}/${cited.id}`).toBe(original.publication);
        expect(cited.url, `${article.id}/${cited.id}`).toBe(original.url);
        expect(cited.accessedAt, `${article.id}/${cited.id}`).toBe(original.accessedAt);
        expect(cited.sourceType, `${article.id}/${cited.id}`).toBe(original.sourceType);
      }
    }
  });
});
