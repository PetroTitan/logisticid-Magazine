import type { Block, Inline } from "@/content/types";

/**
 * The editorial Markdown parser.
 *
 * This deliberately does not use a general Markdown library, and it does not
 * produce an HTML string. It parses a small, fixed subset of Markdown into the
 * typed block tree in `types.ts`, which the renderer turns into React elements.
 *
 * The reason is security rather than taste. A general parser's job is to pass
 * through anything it does not recognise, including raw HTML and `javascript:`
 * URLs, and the usual fix — render the HTML string with
 * `dangerouslySetInnerHTML` and sanitise it first — makes the safety of every
 * article depend on a sanitiser's blocklist being complete. Parsing to a typed
 * tree inverts that: the renderer can only emit the elements the tree can
 * describe, so there is no representation for a `<script>` and nothing for a
 * sanitiser to miss.
 *
 * Anything the subset does not cover is a parse error at build time, not
 * silently dropped output. An editor who writes unsupported syntax is told;
 * they do not discover it missing from the published page.
 *
 * ## Supported syntax
 *
 *   ## Heading            h2          ### Heading   h3
 *   - item                unordered list
 *   1. item               ordered list
 *   > quote               blockquote. An attribution line is part of the
 *   > — Attribution        quote, so it carries its own ">" and begins "— ".
 *   | a | b |             table, requires a |---|---| separator row
 *   :::boundary ... :::   professional-boundary callout
 *   :::context ... :::    contextual callout
 *   plain lines           paragraph
 *
 *   **bold**  *italic*  `code`  [text](https://...)  [^source-id]
 */

/** URL schemes an editorial link is allowed to use. */
const ALLOWED_PROTOCOLS = new Set(["https:", "mailto:"]);

export class MarkdownError extends Error {}

function fail(line: number, message: string): never {
  throw new MarkdownError(`line ${line}: ${message}`);
}

/* ------------------------------------------------------------------ */
/* Inline parsing                                                      */
/* ------------------------------------------------------------------ */

/**
 * Turn a heading's text into a stable fragment id.
 *
 * Deterministic, so an in-page anchor that is linked from elsewhere does not
 * change when the build runs again.
 */
export function headingId(text: string): string {
  const id = text
    .toLowerCase()
    /*
     * German letters are TRANSLITERATED, not dropped.
     *
     * Without this the rule below turns every umlaut into a hyphen, and the
     * German pilot article shipped with `#was-tats-chlich-kalkuliert-wird` —
     * a fragment nobody can read and nobody would type. Worse, it is lossy in
     * a way that collides: `Grüße` and `Grosse` reduce to the same id, and the
     * build had nothing to say about it.
     *
     * The mapping is the one the main site's URL policy already uses for
     * German paths (docs/localization/de/style-guide.md): ä→ae, ö→oe, ü→ue,
     * ß→ss. Using a second transliteration for fragments would make the same
     * word slug differently depending on where it appeared.
     */
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return id === "" ? "section" : id;
}

/** Flatten an inline tree back to plain text, for ids, summaries and search. */
export function inlineToText(nodes: Inline[]): string {
  return nodes
    .map((node) => {
      switch (node.kind) {
        case "text":
          return node.value;
        case "code":
          return node.value;
        case "citation":
          return "";
        case "strong":
        case "emphasis":
        case "link":
          return inlineToText(node.children);
      }
    })
    .join("");
}

/**
 * Validate an editorial link target.
 *
 * Internal links stay relative so that they keep working under the `/magazine`
 * base path. External links must be https or mailto; anything else — a
 * `javascript:` URL above all — is refused rather than rewritten, because a
 * link an editor did not mean to write should surface as an error.
 */
function checkHref(href: string, line: number): { href: string; external: boolean } {
  if (href.startsWith("/") || href.startsWith("#")) {
    return { href, external: false };
  }

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return fail(line, `link target is neither a site-relative path nor an absolute URL: ${href}`);
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return fail(line, `link protocol ${url.protocol} is not allowed (use https: or mailto:): ${href}`);
  }

  return { href: url.href, external: url.protocol === "https:" };
}

/**
 * Parse the inline syntax of a single run of text.
 *
 * Written as an explicit scanner rather than a chain of regular-expression
 * replacements: replacements would let the output of one rule be re-read as
 * input by the next, which is the classic way a "sanitised" pipeline
 * reconstitutes markup it had just removed.
 */
export function parseInline(raw: string, line: number): Inline[] {
  const out: Inline[] = [];
  let text = "";

  const flush = () => {
    if (text !== "") {
      out.push({ kind: "text", value: text });
      text = "";
    }
  };

  let i = 0;
  while (i < raw.length) {
    const rest = raw.slice(i);

    // Raw HTML is not part of the subset. Refuse it loudly: silently escaping
    // it would publish visible angle brackets an editor did not intend.
    if (/^<[a-zA-Z/!]/.test(rest)) {
      fail(line, "raw HTML is not allowed in editorial content");
    }

    if (rest.startsWith("`")) {
      const end = rest.indexOf("`", 1);
      if (end === -1) fail(line, "unclosed inline code span");
      flush();
      out.push({ kind: "code", value: rest.slice(1, end) });
      i += end + 1;
      continue;
    }

    if (rest.startsWith("**")) {
      const end = rest.indexOf("**", 2);
      if (end === -1) fail(line, "unclosed bold span");
      flush();
      out.push({ kind: "strong", children: parseInline(rest.slice(2, end), line) });
      i += end + 2;
      continue;
    }

    if (rest.startsWith("*")) {
      const end = rest.indexOf("*", 1);
      if (end === -1) fail(line, "unclosed italic span");
      flush();
      out.push({ kind: "emphasis", children: parseInline(rest.slice(1, end), line) });
      i += end + 1;
      continue;
    }

    // Citation reference: [^source-id]
    const citation = /^\[\^([a-z0-9][a-z0-9-]*)\]/.exec(rest);
    if (citation?.[1] !== undefined) {
      flush();
      out.push({ kind: "citation", sourceId: citation[1] });
      i += citation[0].length;
      continue;
    }

    // Link: [text](target)
    if (rest.startsWith("[")) {
      const match = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(rest);
      if (match?.[1] === undefined || match[2] === undefined) {
        fail(line, "malformed link: expected [text](target)");
      }
      const { href, external } = checkHref(match[2], line);
      flush();
      out.push({ kind: "link", href, external, children: parseInline(match[1], line) });
      i += match[0].length;
      continue;
    }

    text += raw[i];
    i += 1;
  }

  flush();
  return out;
}

/* ------------------------------------------------------------------ */
/* Block parsing                                                       */
/* ------------------------------------------------------------------ */

function parseTableRow(raw: string, line: number): Inline[][] {
  return raw
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => parseInline(cell.trim(), line));
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i] ?? "";
    const lineNo = i + 1;
    const trimmed = raw.trim();

    if (trimmed === "") {
      i += 1;
      continue;
    }

    // Callout: ::: boundary / ::: context
    const calloutOpen = /^:::(boundary|context)$/.exec(trimmed);
    if (calloutOpen?.[1] !== undefined) {
      const variant = calloutOpen[1] as "boundary" | "context";
      const body: string[] = [];
      i += 1;
      while (i < lines.length && (lines[i] ?? "").trim() !== ":::") {
        body.push(lines[i] ?? "");
        i += 1;
      }
      if (i >= lines.length) fail(lineNo, "unclosed ::: callout");
      i += 1;
      blocks.push({ kind: "note", variant, children: parseInline(body.join(" ").trim(), lineNo) });
      continue;
    }

    // Headings. h1 is the article title, rendered by the page, so an article
    // body that declares its own h1 would produce a second one.
    if (trimmed.startsWith("#")) {
      const match = /^(#{1,6})\s+(.*)$/.exec(trimmed);
      if (match?.[1] === undefined || match[2] === undefined) {
        fail(lineNo, "malformed heading");
      }
      const level = match[1].length;
      if (level === 1) {
        fail(lineNo, "an article body must not contain an h1: the page renders the title as the only h1");
      }
      if (level > 3) {
        fail(lineNo, `heading level ${level} is not supported; use ## or ###`);
      }
      const children = parseInline(match[2], lineNo);
      blocks.push({
        kind: "heading",
        level: level as 2 | 3,
        id: headingId(inlineToText(children)),
        children,
      });
      i += 1;
      continue;
    }

    // Table: a header row followed by a |---| separator.
    if (trimmed.startsWith("|")) {
      const separator = (lines[i + 1] ?? "").trim();
      if (!/^\|[\s:|-]+\|$/.test(separator) || !separator.includes("-")) {
        fail(lineNo, "a table must have a |---|---| separator row directly under its header row");
      }
      const head = parseTableRow(trimmed, lineNo);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) {
        const row = parseTableRow(lines[i] ?? "", i + 1);
        if (row.length !== head.length) {
          fail(i + 1, `table row has ${row.length} cells but the header has ${head.length}`);
        }
        rows.push(row);
        i += 1;
      }
      blocks.push({ kind: "table", head, rows });
      continue;
    }

    // Blockquote, with an optional final attribution line beginning "— ".
    if (trimmed.startsWith(">")) {
      const collected: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith(">")) {
        collected.push((lines[i] ?? "").trim().replace(/^>\s?/, ""));
        i += 1;
      }
      let attribution: string | undefined;
      const last = collected[collected.length - 1];
      if (last !== undefined && last.startsWith("— ")) {
        attribution = last.slice(2).trim();
        collected.pop();
      }
      blocks.push({
        kind: "quote",
        children: parseInline(collected.join(" ").trim(), lineNo),
        ...(attribution === undefined ? {} : { attribution }),
      });
      continue;
    }

    // Lists. A list is homogeneous: mixing bullets and numbers in one run is
    // almost always an editing mistake rather than an intent.
    const bullet = /^[-*]\s+/.test(trimmed);
    const numbered = /^\d+\.\s+/.test(trimmed);
    if (bullet || numbered) {
      const items: Inline[][] = [];
      const ordered = numbered;
      while (i < lines.length) {
        const candidate = (lines[i] ?? "").trim();
        const isBullet = /^[-*]\s+/.test(candidate);
        const isNumbered = /^\d+\.\s+/.test(candidate);
        if (!isBullet && !isNumbered) break;
        if (isNumbered !== ordered) {
          fail(i + 1, "a single list must be either all bulleted or all numbered");
        }
        items.push(parseInline(candidate.replace(/^([-*]|\d+\.)\s+/, ""), i + 1));
        i += 1;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    // Paragraph: consecutive plain lines up to a blank line or a new block.
    const paragraph: string[] = [];
    while (i < lines.length) {
      const candidate = (lines[i] ?? "").trim();
      if (
        candidate === "" ||
        candidate.startsWith("#") ||
        candidate.startsWith(">") ||
        candidate.startsWith("|") ||
        candidate.startsWith(":::") ||
        /^[-*]\s+/.test(candidate) ||
        /^\d+\.\s+/.test(candidate)
      ) {
        break;
      }
      paragraph.push(candidate);
      i += 1;
    }
    blocks.push({ kind: "paragraph", children: parseInline(paragraph.join(" "), lineNo) });
  }

  /*
   * Heading ids are derived, so two headings can collide without either being
   * wrong. A duplicate `id` makes an in-page anchor land on whichever came
   * first — silently, and only for the second one — and it is invalid HTML
   * that no build step would otherwise mention. German raises the odds: the
   * transliteration in `headingId` maps several distinct spellings onto one
   * id, which is the price of readable fragments and is worth paying only
   * with this check behind it.
   */
  const seenIds = new Set<string>();
  for (const block of blocks) {
    if (block.kind !== "heading") continue;
    if (seenIds.has(block.id)) {
      throw new MarkdownError(
        `two headings produce the same id "${block.id}". An in-page anchor can only reach the first, so give one of them different wording.`,
      );
    }
    seenIds.add(block.id);
  }

  return blocks;
}

/** Every source id referenced from a body, in document order. */
export function citedSourceIds(blocks: Block[]): string[] {
  const found: string[] = [];

  const walkInline = (nodes: Inline[]) => {
    for (const node of nodes) {
      if (node.kind === "citation") {
        if (!found.includes(node.sourceId)) found.push(node.sourceId);
      } else if (node.kind === "strong" || node.kind === "emphasis" || node.kind === "link") {
        walkInline(node.children);
      }
    }
  };

  for (const block of blocks) {
    switch (block.kind) {
      case "heading":
      case "paragraph":
      case "quote":
      case "note":
        walkInline(block.children);
        break;
      case "list":
        block.items.forEach(walkInline);
        break;
      case "table":
        block.head.forEach(walkInline);
        block.rows.forEach((row) => row.forEach(walkInline));
        break;
    }
  }

  return found;
}

/** Plain text of a whole body, for reading time and the search index. */
export function blocksToText(blocks: Block[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.kind) {
      case "heading":
      case "paragraph":
      case "quote":
      case "note":
        parts.push(inlineToText(block.children));
        break;
      case "list":
        block.items.forEach((item) => parts.push(inlineToText(item)));
        break;
      case "table":
        block.head.forEach((cell) => parts.push(inlineToText(cell)));
        block.rows.forEach((row) => row.forEach((cell) => parts.push(inlineToText(cell))));
        break;
    }
  }
  return parts.join(" ");
}
