/**
 * Contact form endpoint.
 *
 * Receives a POST from the contact modal (Modal.tsx) and uses Resend to:
 *   1. Notify Danijel of the new conversation request (must-succeed)
 *   2. Send the visitor a brief acknowledgment in their language (best-effort)
 *
 * Required env vars (set in Vercel Project Settings → Environment Variables):
 *   - RESEND_API_KEY        — from https://resend.com/api-keys
 *   - CONTACT_FROM_EMAIL    — must be on a domain you've verified in Resend.
 *                             Example: "Danijel Pevec <noreply@danijelpevec.com>"
 *   - CONTACT_TO_EMAIL      — where notifications land. Defaults to the imprint
 *                             address if unset.
 *   - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (auto-injected by
 *     Vercel's Upstash integration) — optional; rate limiting + Resend
 *     quota protection are skipped if absent.
 *   - RECAPTCHA_SITE_KEY (PUBLIC — un-mark "Sensitive" in Vercel) — the
 *     reCAPTCHA Enterprise key ID. Same value baked into the client
 *     bundle via Modal.astro for grecaptcha.enterprise.execute().
 *   - RECAPTCHA_PROJECT_ID — your Google Cloud project ID (the one the
 *     reCAPTCHA Enterprise key lives in). Used in the assessments API
 *     URL path.
 *   - RECAPTCHA_SECRET_KEY (SENSITIVE) — a Google Cloud API key with
 *     access to the reCAPTCHA Enterprise API. NOT a "secret key" in
 *     the Classic v3 sense — Enterprise has no separate secret keys;
 *     auth is via Cloud API keys or service accounts. We re-use the
 *     env-var slot name for continuity.
 *   When any of those three is unset, the bot check is skipped (dev /
 *   forked deploys still work).
 *
 * Misuse caps:
 *   - Per-IP: 5 submissions / 24h sliding window via Upstash
 *   - Per-message: 5000 chars max (~1000 words)
 *   - reCAPTCHA Enterprise score gate (default min 0.3; lower = more
 *     bot-like). Enterprise returns scores in [0.0, 1.0] same as v3.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import * as Sentry from "@sentry/node";

// Sentry server-side init for this Vercel function. The Astro
// integration doesn't reach the /api/* handlers (they run outside
// the Astro build), so init inline here. No-op when SENTRY_DSN is
// absent — dev/forked deploys still work.
if (process.env.SENTRY_DSN && !Sentry.isInitialized()) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || "development",
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}

type Body = {
  name?: string;
  role?: string;
  company?: string;
  email?: string;
  stage?: string;
  message?: string;
  lang?: "hr" | "en";
  recaptchaToken?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_CHARS = 5000;
const RECAPTCHA_MIN_SCORE = 0.3;
const RECAPTCHA_ACTION = "contact_form";

let ratelimit: Ratelimit | null = null;
try {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 d"),
    analytics: true,
    prefix: "contact",
  });
} catch (err) {
  console.warn("[contact] rate limiting disabled (Upstash env missing):", err);
}

function getClientIp(req: VercelRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]!.trim();
  if (Array.isArray(fwd) && fwd[0]) return fwd[0].split(",")[0]!.trim();
  const real = req.headers["x-real-ip"];
  if (typeof real === "string") return real;
  return "anonymous";
}

// reCAPTCHA Enterprise Assessments API response shape (subset we use).
// Full schema: https://cloud.google.com/recaptcha/docs/reference/rest/v1/projects.assessments
interface EnterpriseAssessment {
  name?: string;
  event?: { token?: string; siteKey?: string; expectedAction?: string };
  tokenProperties?: {
    valid: boolean;
    invalidReason?: string;
    hostname?: string;
    action?: string;
    createTime?: string;
  };
  riskAnalysis?: {
    score?: number;
    reasons?: string[];
  };
  error?: { code: number; message: string; status: string };
}

async function verifyRecaptcha(
  token: string,
  apiKey: string,
  projectId: string,
  siteKey: string,
): Promise<EnterpriseAssessment> {
  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/assessments?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: {
        token,
        siteKey,
        expectedAction: RECAPTCHA_ACTION,
      },
    }),
  });
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("Missing RESEND_API_KEY or CONTACT_FROM_EMAIL env var");
    return res.status(500).json({ error: "Email service is not configured." });
  }
  const to = process.env.CONTACT_TO_EMAIL || "pevec.danijel@alphacapitalis.com";

  const body = (req.body || {}) as Body;
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const message = (body.message || "").trim();

  if (!name) return res.status(400).json({ error: "Name is required." });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: "A valid email is required." });
  if (!message) return res.status(400).json({ error: "Please share a brief note about your situation." });
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(413).json({
      error: `Message is too long (over ${MAX_MESSAGE_CHARS} characters). Please shorten it.`,
    });
  }

  // Per-IP rate limit. Without this a spammer could burn through the
  // Resend daily quota by replaying form submissions.
  const ip = getClientIp(req);
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return res.status(429).json({
        error: "Too many submissions. Please try again tomorrow, or email directly.",
      });
    }
  }

  // reCAPTCHA Enterprise score gate. When all three env vars are set,
  // the client must include a valid token from
  // grecaptcha.enterprise.execute(); the Enterprise Assessments API
  // returns tokenProperties.valid + riskAnalysis.score in [0.0, 1.0]
  // plus the action the token was issued for. Reject invalid tokens,
  // low scores, and action mismatches as bots. When env vars are
  // absent (dev / forked deploys) skip the check entirely.
  const apiKey = process.env.RECAPTCHA_SECRET_KEY; // Cloud API key
  const projectId = process.env.RECAPTCHA_PROJECT_ID;
  const siteKey = process.env.RECAPTCHA_SITE_KEY;
  if (apiKey && projectId && siteKey) {
    const token = (body.recaptchaToken || "").trim();
    if (!token) {
      return res.status(400).json({ error: "Bot check required. Please retry." });
    }
    try {
      const assessment = await verifyRecaptcha(token, apiKey, projectId, siteKey);
      const score = assessment.riskAnalysis?.score ?? 0;
      const valid = assessment.tokenProperties?.valid === true;
      const action = assessment.tokenProperties?.action;
      if (
        !valid ||
        action !== RECAPTCHA_ACTION ||
        score < RECAPTCHA_MIN_SCORE ||
        assessment.error
      ) {
        console.warn("[contact] reCAPTCHA rejected:", {
          valid,
          score,
          action,
          invalidReason: assessment.tokenProperties?.invalidReason,
          reasons: assessment.riskAnalysis?.reasons,
          error: assessment.error,
        });
        return res.status(403).json({
          error: "Bot check failed. Please retry, or email directly.",
        });
      }
    } catch (err) {
      console.error("[contact] reCAPTCHA verify error:", err);
      Sentry.captureException(err, { tags: { source: "contact", step: "recaptcha-verify" } });
      // Fail closed when verify itself errors — better to occasionally
      // reject a real human than to let bots through silently.
      return res.status(503).json({
        error: "Bot check is temporarily unavailable. Please try again shortly.",
      });
    }
  }

  const role = (body.role || "").trim();
  const company = (body.company || "").trim();
  const stage = (body.stage || "").trim();
  const lang = body.lang === "en" ? "en" : "hr";

  const resend = new Resend(apiKey);

  const internalText = [
    `New private conversation request from danijelpevec.com`,
    ``,
    `Name:    ${name}`,
    `Email:   ${email}`,
    role ? `Role:    ${role}` : null,
    company ? `Company: ${company}` : null,
    stage ? `Stage:   ${stage}` : null,
    `Lang:    ${lang}`,
    ``,
    `Message:`,
    message,
  ].filter((line): line is string => line !== null).join("\n");

  const ackSubject = lang === "en" ? "Thank you, your inquiry has been received" : "Hvala, Vaš upit je zaprimljen";
  const ackText =
    lang === "en"
      ? `Hi ${name},\n\nThank you for your message. I'll read it personally and get back to you.\n\n— Danijel Pevec`
      : `Poštovani/a ${name},\n\nHvala na poruci. Osobno ću je pročitati i javiti Vam se povratno.\n\n— Danijel Pevec`;

  const [notifyResult, ackResult] = await Promise.allSettled([
    resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Private conversation request — ${name}`,
      text: internalText,
    }),
    resend.emails.send({
      from,
      to: email,
      replyTo: to,
      subject: ackSubject,
      text: ackText,
    }),
  ]);

  if (ackResult.status === "rejected") {
    console.error("Resend ack error (non-fatal):", ackResult.reason);
  } else if (ackResult.value.error) {
    console.error("Resend ack error (non-fatal):", ackResult.value.error);
  }

  if (notifyResult.status === "rejected") {
    console.error("Resend notify exception:", notifyResult.reason);
    Sentry.captureException(notifyResult.reason, {
      tags: { source: "contact", step: "resend-notify" },
    });
    // Flush before the serverless function freezes — Sentry's batched
    // transport otherwise loses events when Vercel terminates the
    // invocation. 2s is enough headroom on a healthy network.
    await Sentry.flush(2000).catch(() => {});
    return res.status(500).json({ error: "Could not deliver the message. Please try again, or email directly." });
  }
  if (notifyResult.value.error) {
    console.error("Resend notify error:", notifyResult.value.error);
    Sentry.captureMessage("Resend notify returned error", {
      level: "error",
      tags: { source: "contact", step: "resend-notify" },
      extra: { resendError: notifyResult.value.error },
    });
    await Sentry.flush(2000).catch(() => {});
    return res.status(502).json({ error: "Could not deliver the message. Please try again, or email directly." });
  }

  return res.status(200).json({ ok: true });
}
