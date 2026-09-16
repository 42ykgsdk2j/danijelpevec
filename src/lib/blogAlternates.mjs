/**
 * Build-time helper for astro.config.mjs (plain Node — astro:content is not
 * available there). Reads the frontmatter of every post under
 * src/content/blog/{hr,en}/ and returns, for each blog-post URL path, the
 * hreflang alternates the sitemap should list.
 *
 * Posts are paired by their `translationKey` frontmatter field (falling back
 * to the filename slug), mirroring translationKeyOf() in content.config.ts.
 * Only pairs with both languages present produce alternates.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LANGS = ["hr", "en"];

function postPath(lang, slug) {
  return lang === "hr" ? `/blog/${slug}/` : `/en/blog/${slug}/`;
}

function readTranslationKey(file, fallback) {
  const src = readFileSync(file, "utf8");
  const frontmatter = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const m = frontmatter?.[1].match(/^translationKey:\s*["']?([^"'\r\n]+?)["']?\s*$/m);
  return m ? m[1].trim() : fallback;
}

/**
 * @param {string} contentDir absolute path to src/content/blog
 * @returns {Map<string, {lang: string, path: string}[]>} path → alternates
 */
export function readBlogAlternates(contentDir) {
  const byKey = new Map(); // translationKey → { hr?: path, en?: path }
  for (const lang of LANGS) {
    const dir = join(contentDir, lang);
    let files = [];
    try {
      files = readdirSync(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const slug = file.replace(/\.md$/, "");
      const key = readTranslationKey(join(dir, file), slug);
      const entry = byKey.get(key) ?? {};
      entry[lang] = postPath(lang, slug);
      byKey.set(key, entry);
    }
  }
  const alternates = new Map();
  for (const entry of byKey.values()) {
    const links = LANGS.filter((l) => entry[l]).map((l) => ({ lang: l, path: entry[l] }));
    if (links.length < 2) continue;
    for (const link of links) alternates.set(link.path, links);
  }
  return alternates;
}
