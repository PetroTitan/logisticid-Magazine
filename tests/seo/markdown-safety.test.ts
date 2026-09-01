import { describe, expect, it } from "vitest";

import { MarkdownError, parseInline, parseMarkdown } from "@/content/markdown";

/**
 * The editorial content pipeline's security properties.
 *
 * The renderer turns a typed tree into React elements and never receives an
 * HTML string, so these tests assert the parser's half of that contract: that
 * the dangerous constructs are refused at build time rather than escaped,
 * dropped or passed through.
 */
describe("editorial Markdown refuses", () => {
  it("raw HTML", () => {
    expect(() => parseMarkdown("<script>alert(1)</script>\n")).toThrow(MarkdownError);
    expect(() => parseMarkdown("An <img src=x onerror=alert(1)> inline.\n")).toThrow(MarkdownError);
  });

  it("javascript: link targets", () => {
    expect(() => parseInline("[click](javascript:alert(1))", 1)).toThrow(/protocol/);
  });

  it("data: link targets", () => {
    expect(() => parseInline("[x](data:text/html,<script>)", 1)).toThrow(/protocol/);
  });

  it("plain http link targets", () => {
    expect(() => parseInline("[x](http://example.com)", 1)).toThrow(/protocol/);
  });

  it("an h1 inside an article body, so the page keeps exactly one", () => {
    expect(() => parseMarkdown("# A second h1\n")).toThrow(/must not contain an h1/);
  });

  it("an unclosed emphasis or code span rather than guessing", () => {
    expect(() => parseInline("**unclosed", 1)).toThrow(/unclosed/);
    expect(() => parseInline("`unclosed", 1)).toThrow(/unclosed/);
  });

  it("a table without a separator row", () => {
    expect(() => parseMarkdown("| a | b |\n| 1 | 2 |\n")).toThrow(/separator row/);
  });
});

describe("editorial Markdown accepts", () => {
  it("https and site-relative links", () => {
    const nodes = parseInline("[a](https://example.com) and [b](/corrections)", 1);
    const links = nodes.filter((node) => node.kind === "link");
    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({ external: true });
    expect(links[1]).toMatchObject({ external: false });
  });

  it("headings, lists, quotes, tables and callouts", () => {
    const blocks = parseMarkdown(
      [
        "## Heading",
        "",
        "A paragraph.",
        "",
        "- one",
        "- two",
        "",
        "> Quoted.",
        "> — Someone",
        "",
        "| a | b |",
        "| --- | --- |",
        "| 1 | 2 |",
        "",
        ":::boundary",
        "Consult a professional.",
        ":::",
        "",
      ].join("\n"),
    );

    expect(blocks.map((block) => block.kind)).toEqual([
      "heading",
      "paragraph",
      "list",
      "quote",
      "table",
      "note",
    ]);
  });

  it("gives headings deterministic ids", () => {
    const [heading] = parseMarkdown("## What this covers\n");
    expect(heading).toMatchObject({ kind: "heading", id: "what-this-covers" });
  });
});
