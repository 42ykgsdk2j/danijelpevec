/**
 * Tiny markdown-to-React converter for the BlogChat assistant bubbles.
 *
 * Why not react-markdown + remark-gfm? They ship ~290 KB of unified-
 * ecosystem JS for what amounts to four formatting patterns. The
 * AI's system prompt caps answers at 2–4 sentences and steers clear
 * of GFM features (tables, strikethrough, task lists). What's left is
 * paragraphs, bold, italic, inline code, links, and the occasional
 * bullet list — all of which fit in ~60 lines.
 *
 * Safety: React escapes text by default. The only place HTML can be
 * injected is the link href (after the `[text](url)` syntax). We
 * accept http/https/mailto/tel and drop anything else.
 */
import { type ReactNode } from "react";

const SAFE_PROTOCOL = /^(https?:|mailto:|tel:|\/|#)/i;

function safeHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (SAFE_PROTOCOL.test(trimmed)) return trimmed;
  return null;
}

// Inline transforms — bold, italic, code, link. Returns a React fragment
// of strings + elements. Order matters: we tokenise greedily by scanning
// the string and emitting fragments as we go.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let i = 0;
  let buf = "";
  let key = 0;
  const flush = () => {
    if (buf.length > 0) {
      nodes.push(buf);
      buf = "";
    }
  };
  while (i < text.length) {
    const ch = text[i];
    // Link: [text](url)
    if (ch === "[") {
      const close = text.indexOf("](", i + 1);
      if (close > -1) {
        const urlEnd = text.indexOf(")", close + 2);
        if (urlEnd > -1) {
          const label = text.slice(i + 1, close);
          const url = safeHref(text.slice(close + 2, urlEnd));
          if (url) {
            flush();
            const external = /^https?:/i.test(url);
            nodes.push(
              <a
                key={`${keyPrefix}-l-${key++}`}
                href={url}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {renderInline(label, `${keyPrefix}-l${key}`)}
              </a>,
            );
            i = urlEnd + 1;
            continue;
          }
        }
      }
    }
    // Bold: **x**
    if (ch === "*" && text[i + 1] === "*") {
      const end = text.indexOf("**", i + 2);
      if (end > -1) {
        flush();
        nodes.push(
          <strong key={`${keyPrefix}-b-${key++}`}>
            {renderInline(text.slice(i + 2, end), `${keyPrefix}-b${key}`)}
          </strong>,
        );
        i = end + 2;
        continue;
      }
    }
    // Italic: *x* (must not be part of **)
    if (ch === "*" && text[i - 1] !== "*" && text[i + 1] !== "*") {
      const end = text.indexOf("*", i + 1);
      if (end > -1 && text[end + 1] !== "*") {
        flush();
        nodes.push(
          <em key={`${keyPrefix}-i-${key++}`}>
            {renderInline(text.slice(i + 1, end), `${keyPrefix}-i${key}`)}
          </em>,
        );
        i = end + 1;
        continue;
      }
    }
    // Inline code: `x`
    if (ch === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > -1) {
        flush();
        nodes.push(<code key={`${keyPrefix}-c-${key++}`}>{text.slice(i + 1, end)}</code>);
        i = end + 1;
        continue;
      }
    }
    buf += ch;
    i++;
  }
  flush();
  return nodes;
}

/**
 * Renders a (possibly streaming) markdown string as React nodes.
 * Supported blocks:
 *   - Paragraphs (separated by blank lines)
 *   - Unordered lists (lines starting with "- " or "* ")
 *   - Ordered lists (lines starting with "1. " etc.)
 * Anything else falls back to a paragraph with inline formatting.
 */
export function TinyMarkdown({ children }: { children: string }) {
  // Split on blank lines (two or more newlines) → blocks.
  const blocks = (children ?? "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  const out: ReactNode[] = [];
  blocks.forEach((block, bi) => {
    const lines = block.split("\n");
    // Unordered list
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      out.push(
        <ul key={`b${bi}`}>
          {lines.map((l, li) => (
            <li key={`b${bi}-l${li}`}>{renderInline(l.replace(/^\s*[-*]\s+/, ""), `b${bi}-l${li}`)}</li>
          ))}
        </ul>,
      );
      return;
    }
    // Ordered list
    if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
      out.push(
        <ol key={`b${bi}`}>
          {lines.map((l, li) => (
            <li key={`b${bi}-l${li}`}>{renderInline(l.replace(/^\s*\d+\.\s+/, ""), `b${bi}-l${li}`)}</li>
          ))}
        </ol>,
      );
      return;
    }
    // Default: paragraph with soft line breaks honored.
    const inlineNodes = lines.flatMap((l, li) => {
      const rendered = renderInline(l, `b${bi}-l${li}`);
      return li === lines.length - 1
        ? rendered
        : [...rendered, <br key={`b${bi}-l${li}-br`} />];
    });
    out.push(<p key={`b${bi}`}>{inlineNodes}</p>);
  });

  return <>{out}</>;
}
