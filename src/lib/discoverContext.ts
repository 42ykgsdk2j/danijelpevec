/**
 * Composes the grounding text passed to /api/chat as `postBody` when the
 * Chat component runs in discover mode on the blog index page. Pulls
 * every published article for the given locale and dumps title +
 * category + URL + excerpt per post so the model can:
 *   1. Derive the set of themes the blog covers (for the intro).
 *   2. Recommend up to 3 posts as clickable markdown links once the
 *      user names a theme they want to explore.
 *
 * The URLs are emitted as absolute paths (e.g. /blog/<slug>/) so that
 * the markdown links the model produces render as same-origin
 * navigation through TinyMarkdown's safeHref allowlist.
 */
import { getCollection } from "astro:content";
import { url, type Lang } from "./i18n";
import { langOf, slugOf } from "../content.config";

export async function getDiscoverContext(
  lang: Lang,
): Promise<{ title: string; body: string }> {
  const all = await getCollection("blog", (entry) => langOf(entry.id) === lang);
  const posts = all.sort((a, b) => b.data.date.localeCompare(a.data.date));

  const isHr = lang === "hr";
  const labels = isHr
    ? { title: "NASLOV", category: "KATEGORIJA", url: "URL", excerpt: "OPIS" }
    : { title: "TITLE", category: "CATEGORY", url: "URL", excerpt: "EXCERPT" };

  const lines = posts.map((p) => {
    const slug = slugOf(p.id);
    const href = url(lang, `blog/${slug}`);
    return [
      `${labels.title}: ${p.data.title}`,
      `${labels.category}: ${p.data.category}`,
      `${labels.url}: ${href}`,
      `${labels.excerpt}: ${p.data.excerpt}`,
    ].join("\n");
  });

  const title = isHr
    ? "Katalog svih objava na blogu"
    : "Catalog of all blog posts";
  const body = lines.join("\n---\n");
  return { title, body };
}
