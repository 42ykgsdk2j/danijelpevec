/**
 * Pulls the question/answer pairs out of a post's FAQ block so they can be
 * emitted as FAQPage JSON-LD. Posts write the FAQ as raw HTML in the
 * markdown body:
 *
 *   <section class="article-faq">
 *   <h2>Frequently asked questions</h2>
 *   <details><summary>Question?</summary><p>Answer…</p></details>
 *   …
 *   </section>
 *
 * `<details>` may sit on one line or span several. Returns [] when the post
 * has no FAQ block.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

const SECTION_RE = /<section[^>]*class=["'][^"']*\barticle-faq\b[^"']*["'][^>]*>([\s\S]*?)<\/section>/i;
const DETAILS_RE = /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** HTML fragment → plain text: drop tags, decode entities, collapse whitespace. */
function toPlainText(html: string): string {
  return html
    .replace(/<\/p>\s*<p[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
      if (code[0] === "#") {
        const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return ENTITIES[code.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function extractFaq(body: string | undefined): FaqItem[] {
  const section = body?.match(SECTION_RE)?.[1];
  if (!section) return [];
  const items: FaqItem[] = [];
  for (const [, q, a] of section.matchAll(DETAILS_RE)) {
    const question = toPlainText(q);
    const answer = toPlainText(a);
    if (question && answer) items.push({ question, answer });
  }
  return items;
}
