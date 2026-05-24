import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * One post per (slug, language). Files live under
 *   src/content/blog/<lang>/<slug>.md
 * The id is the full path-without-extension (e.g. "en/foo"), which gives us
 * both the language and the URL slug. Frontmatter only carries content
 * fields — lang and slug are NOT required, so Decap CMS (which writes the
 * file but doesn't know to add a lang field) works without crashing the
 * build.
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
    // Legacy fields — kept optional so older files don't fail validation
    slug: z.string().optional(),
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

export const collections = { blog };
