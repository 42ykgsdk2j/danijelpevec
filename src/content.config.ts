import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * One post per (slug, language). The filename pattern is `<slug>.<lang>.md`
 * so a single slug like "family-business-succession-planning" has two
 * matching .md files — one for EN, one for HR.
 */
const blog = defineCollection({
  // Files live under src/content/blog/<lang>/<slug>.md. We use the full
  // relative path as the id so the EN and HR copies of the same slug stay
  // distinct entries.
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/blog",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({
    slug: z.string(),
    lang: z.enum(["en", "hr"]),
    title: z.string(),
    excerpt: z.string(),
    category: z.string(),
    date: z.string(),
    readTime: z.number(),
  }),
});

export const collections = { blog };
