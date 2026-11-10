/**
 * Nightly rebuild trigger (Vercel cron — see "crons" in vercel.json).
 *
 * The site is fully static and blog posts are filtered by publish date
 * at build time (src/lib/published.ts), so a scheduled post only
 * appears when the site is rebuilt. This endpoint fires the project's
 * Deploy Hook shortly after midnight Croatian time; the resulting
 * build publishes any post whose date has arrived.
 *
 * Required env vars (Vercel Project Settings → Environment Variables):
 *   - DEPLOY_HOOK_URL — a Deploy Hook for the production branch
 *     (Settings → Git → Deploy Hooks). Treat it as a secret: anyone
 *     holding the URL can trigger builds.
 *   - CRON_SECRET — random string. Vercel sends it automatically as
 *     "Authorization: Bearer <CRON_SECRET>" on cron invocations; the
 *     handler rejects calls without it, so strangers cannot spam
 *     deploys by hitting the URL.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  const hook = process.env.DEPLOY_HOOK_URL;
  if (!hook) {
    res.status(503).json({ ok: false, error: "DEPLOY_HOOK_URL is not configured" });
    return;
  }

  const r = await fetch(hook, { method: "POST" });
  const body = await r.text().catch(() => "");
  res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status, body: body.slice(0, 300) });
}
