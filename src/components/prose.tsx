import { Fragment, type ReactNode } from "react";
import Link from "next/link";

import type { Block, Inline, Source } from "@/content/types";

/**
 * Renders a parsed article body.
 *
 * The input is the typed block tree produced by the Markdown parser, never an
 * HTML string, so this component cannot emit an element the tree has no
 * representation for. That is the whole security model for editorial content:
 * there is no `dangerouslySetInnerHTML` anywhere in the render path, so there
 * is no sanitiser whose blocklist could be incomplete.
 */

function renderInline(nodes: Inline[], sourceOrder: Map<string, number>): ReactNode {
  return nodes.map((node, index) => {
    switch (node.kind) {
      case "text":
        return <Fragment key={index}>{node.value}</Fragment>;

      case "strong":
        return <strong key={index}>{renderInline(node.children, sourceOrder)}</strong>;

      case "emphasis":
        return <em key={index}>{renderInline(node.children, sourceOrder)}</em>;

      case "code":
        return <code key={index}>{node.value}</code>;

      case "link":
        // External links open in place. A `target="_blank"` would need
        // `rel="noopener"` to be safe and would take the reader's navigation
        // decision away from them; neither is worth it for a citation link.
        return node.external ? (
          <a href={node.href} key={index} rel="nofollow noopener">
            {renderInline(node.children, sourceOrder)}
          </a>
        ) : (
          <Link href={node.href} key={index}>
            {renderInline(node.children, sourceOrder)}
          </Link>
        );

      case "citation": {
        const number = sourceOrder.get(node.sourceId);
        // Unresolvable citations are rejected at build time, so this is
        // unreachable in a built article; rendering nothing is the safe
        // fallback rather than printing a broken marker.
        if (number === undefined) return null;
        return (
          <a
            aria-label={`Reference ${number}`}
            className="citation"
            href={`#reference-${node.sourceId}`}
            key={index}
          >
            [{number}]
          </a>
        );
      }
    }
  });
}

const NOTE_LABEL: Record<"boundary" | "context", string> = {
  boundary: "Where this stops and a professional starts",
  context: "Context",
};

export function Prose({ blocks, sources }: { blocks: Block[]; sources: readonly Source[] }) {
  // Citation numbers follow the order sources are listed, which is the order
  // they appear in the reference list, so [3] is always the third reference.
  const sourceOrder = new Map(sources.map((source, index) => [source.id, index + 1]));

  return (
    <div className="prose">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "heading": {
            const Tag = block.level === 2 ? "h2" : "h3";
            return (
              <Tag id={block.id} key={index}>
                {renderInline(block.children, sourceOrder)}
              </Tag>
            );
          }

          case "paragraph":
            return <p key={index}>{renderInline(block.children, sourceOrder)}</p>;

          case "list": {
            const items = block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{renderInline(item, sourceOrder)}</li>
            ));
            return block.ordered ? <ol key={index}>{items}</ol> : <ul key={index}>{items}</ul>;
          }

          case "quote":
            return (
              <blockquote key={index}>
                <p>{renderInline(block.children, sourceOrder)}</p>
                {block.attribution === undefined ? null : <footer>{block.attribution}</footer>}
              </blockquote>
            );

          case "note":
            return (
              <aside className={`note note--${block.variant}`} key={index}>
                <span className="note__label">{NOTE_LABEL[block.variant]}</span>
                <p>{renderInline(block.children, sourceOrder)}</p>
              </aside>
            );

          case "table":
            return (
              // A wide table scrolls inside this container. Without it the
              // page body scrolls sideways on a phone, which breaks every
              // other column on the page as well.
              <div className="table-scroll" key={index} tabIndex={0} role="region" aria-label="Table">
                <table>
                  <thead>
                    <tr>
                      {block.head.map((cell, cellIndex) => (
                        <th key={cellIndex} scope="col">
                          {renderInline(cell, sourceOrder)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{renderInline(cell, sourceOrder)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
