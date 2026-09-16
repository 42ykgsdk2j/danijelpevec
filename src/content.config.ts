import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * One post per (slug, language). Files live under
 *   src/content/blog/<lang>/<slug>.md
 * The id is the full path-without-extension (e.g. "en/foo"), which gives us
 * both the language and the URL slug.
 *
 * Slugs are written in the post's own language (Croatian under hr/, English
 * under en/), so the two versions of an article do NOT share a filename.
 * They are paired through the optional `translationKey` frontmatter field:
 * give both files the same key and the site links them via hreflang, the
 * nav language toggle and the sitemap. A file without a key falls back to
 * its own filename slug, which keeps older same-slug pairs working.
 *
 * Frontmatter only carries content fields — lang is NOT required, so Decap
 * CMS (which writes the file but doesn't know to add a lang field) works
 * without crashing the build.
 */
const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/blog",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    category: z.string(),
    // Stored as full ISO datetime so two posts created on the same day sort
    // correctly by time. Date-only frontmatter (e.g. "2026-04-22") parses to
    // midnight UTC, so existing posts retain stable order.
    date: z.coerce.date().transform((d) => d.toISOString()),
    readTime: z.number().int().min(1),
    // Optional cover image, shown between the byline and the body.
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    // Pairs this post with its translation in the other language folder.
    translationKey: z.string().optional(),
    // Legacy field — kept optional so older files don't fail validation
    lang: z.enum(["en", "hr"]).optional(),
  }),
});

/** Derive language from the entry id ("en/foo" or "hr/foo"). */
export function langOf(id: string): "en" | "hr" {
  return id.startsWith("hr/") ? "hr" : "en";
}

/** Derive URL slug from the entry id, stripping the language folder. */
export function slugOf(id: string): string {
  return id.replace(/^(en|hr)\//, "");
}

/** Key that pairs a post with its translation; falls back to the filename slug. */
export function translationKeyOf(entry: {
  id: string;
  data: { translationKey?: string };
}): string {
  return entry.data.translationKey ?? slugOf(entry.id);
}

export const collections = { blog };
