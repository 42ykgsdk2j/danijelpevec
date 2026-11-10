/**
 * Build-time publish gate for blog posts.
 *
 * A post is public once its `date` has arrived in Croatia
 * (Europe/Zagreb). The site is fully static, so the gate is evaluated
 * when the site builds: future-dated posts are left out of every page,
 * list, sitemap entry and llms.txt line. A nightly Vercel cron
 * (vercel.json "crons" → /api/rebuild.ts) redeploys the site just after
 * midnight Croatian time, so each scheduled post goes live on its own
 * date without a manual deploy.
 */
import type { CollectionEntry } from "astro:content";

/** Today's calendar date in Croatia, as "YYYY-MM-DD". */
export function todayInZagreb(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** True once the post's publish date has arrived (Croatian time). */
export function isPublished(entry: CollectionEntry<"blog">): boolean {
  // `date` is an ISO datetime string (see content.config.ts); its first
  // ten characters are the calendar date the author scheduled.
  return entry.data.date.slice(0, 10) <= todayInZagreb();
}
