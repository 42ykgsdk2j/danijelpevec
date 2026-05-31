/**
 * Sentry server-side initialization for Astro's SSR/SSG build step
 * (page renders). Auto-loaded by @sentry/astro.
 *
 * Note: the Vercel functions at /api/* (api/contact.ts, api/chat.ts)
 * are NOT part of the Astro build — they're standalone serverless
 * handlers. /api/contact.ts has its own @sentry/node init inline.
 * /api/chat.ts (edge runtime) is not Sentry-instrumented yet.
 */
import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
});
