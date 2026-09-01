---
{
  "id": "how-logisticid-magazine-sources-freight-information",
  "slug": "how-logisticid-magazine-sources-freight-information",
  "section": "logisticid",
  "title": "How LogisticID Magazine sources freight and transport information",
  "subtitle": "The hierarchy of sources this publication works from, and the specific failure modes in freight writing it is designed to avoid.",
  "description": "Freight information degrades as it is copied between trade blogs. This article sets out the source hierarchy LogisticID Magazine works from, what it refuses to treat as evidence, and how citations are enforced by the build.",
  "summary": "A description of the source hierarchy, the treatment of paywalled standards, the enforcement of citations at build time, and the reasons AI-generated summaries are not treated as sources.",
  "tags": ["editorial standards", "sourcing"],
  "authors": ["logisticid-editorial-team"],
  "datePublished": "2026-09-01",
  "status": "PUBLISHED",
  "schemaType": "Article",
  "relatedLogisticID": [{ "type": "page", "path": "/" }],
  "relatedArticles": ["welcome-to-logisticid-magazine"]
}
---

There is a particular way freight information goes wrong. A trade publication paraphrases a regulation. A blog paraphrases the paraphrase and rounds a threshold. An aggregator restates the blog. A language model, trained on all three, produces a confident sentence with a regulation number attached. By the time it reaches a reader the claim has a specific figure, an authoritative tone, and no remaining connection to the text it came from.

The claim now appears in twenty places. It has not thereby been confirmed twenty times.

This article describes how LogisticID Magazine tries not to add to that pile.

## The hierarchy

Material factual claims are supported from the highest tier that actually covers them:

1. EU institutions and EUR-Lex, for European law;
2. national transport, customs and other public authorities;
3. UNECE and other intergovernmental bodies;
4. Eurostat and national statistics offices;
5. recognised research institutions and peer-reviewed literature;
6. standards bodies, where the material is publicly accessible;
7. the IRU and comparable sector institutions;
8. official infrastructure and operator documentation;
9. first-party company announcements, for facts about that company;
10. manufacturer technical documentation, for equipment specifics.

Trade press is genuinely useful, but as a way of *finding* the primary source rather than standing in for it. A news report that a rule has changed is a prompt to go and read the rule.

## What is not treated as evidence

Factual articles here are not built on SEO blogs, affiliate pages, anonymous carrier blogs, scraped summaries, content aggregators or AI-generated summaries.

The reason is not snobbery about where writing appears. It is that these sources share a failure mode: they reproduce each other, so the usual signal a reader relies on — the same fact appearing in several independent places — stops working. Independence is the thing being checked, and in that corner of the web it is absent.

## Sources that could not be read in full

Some of the most relevant material in transport is paid. Standards in particular are often available only as an abstract and a table of contents unless purchased.

Where that is the case, the reference says so, and the article does not present the full text as having been read.

This is a small piece of bookkeeping that matters more than it looks. Claiming to have read a standard that was never opened is the form of fabrication hardest for a reader to detect, because the citation is real, the standard exists, and the number is correct. Only the reading did not happen.

## Access dates are recorded, not generated

Every reference records the date the source was actually consulted by a person.

That date is never produced by the build, and never set to the publication date as a convenience. It would be trivial to generate — and a generated access date is a false statement about editorial work that did not occur, dressed as diligence.

## Citations are enforced, not encouraged

Both directions are checked when the site is built, and either failure stops publication:

- an article that cites a source it has not listed does not build;
- an article that lists a source it never cites does not build.

The second rule is the less obvious one and does the more interesting work. A reference list padded with authorities the article never used is a way of borrowing their credibility, and it is invisible to a reader, who has no way to know that reference 7 supports nothing above it.

## Time-sensitive material

Legal, regulatory and market claims decay. Articles covering them carry the jurisdiction they apply to and the date the position was checked — both, because a rule without a place is not a rule and a rule without a date is not one a reader can rely on.

:::boundary
Sourcing an article well is not the same as it applying to your situation. A regulation correctly summarised here may still not be the one that governs your shipment, and the determination of which rules apply to a specific load, route and jurisdiction is a matter for a forwarder, a customs broker or the relevant authority.
:::

## Why this is a published page

Every publication believes it is careful. Writing the rules down converts that belief into something a reader can hold this one to — and something a future contributor inherits rather than has to reconstruct.
