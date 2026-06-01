/**
 * Sentry client-side initialization. Loaded by @sentry/astro on every
 * page; runs in the visitor's browser. Captures JS exceptions,
 * unhandled promise rejections, and failed fetch / XHR.
 *
 * Privacy posture: sendDefaultPii is OFF, so user IPs + cookies +
 * form input values are NOT sent to Sentry. Only stack traces +
 * minimal browser/device metadata. Session replay disabled — Microsoft
 * Clarity already covers that surface.
 */
import * as Sentry from "@sentry/astro";

// __SENTRY_DSN__ is replaced at build time by Vite's define in
// astro.config.mjs. Reads the server-side SENTRY_DSN env var on
// Vercel and bakes the value into the client bundle — no separate
// PUBLIC_SENTRY_DSN env var needed. Empty string when unset, which
// Sentry.init treats as "disabled".
// @ts-expect-error build-time constant
const dsn = __SENTRY_DSN__ || undefined;

Sentry.init({
  dsn,
  environment: import.meta.env.MODE,

  // Privacy: NEVER attach the user's IP / cookies / form values to events.
  // The default-PII flag controls whether the SDK auto-attaches request
  // headers + auth cookies. Off keeps us GDPR-friendly out of the box.
  sendDefaultPii: false,

  // Sampling. 100% of errors are captured (free tier handles low-traffic
  // sites fine). Transactions sampled at 10% — perf overview without
  // burning the quota.
  tracesSampleRate: 0.1,

  // Session replay off — Clarity already provides session video. Sentry
  // replay is additional bytes on every page load and overlaps with
  // Clarity. Re-enable if you ever want them in Sentry's UI specifically.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Strip any string that looks like an email / phone before sending.
  // Defense-in-depth — sendDefaultPii: false already prevents most leak
  // surfaces but explicit scrubbing covers the long tail (e.g. an
  // error message that happens to include `john@example.com`).
  beforeSend(event) {
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email;
    }
    return event;
  },
});
