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
 *
 * Misuse caps:
 *   - Per-IP: 5 submissions / 24h sliding window via Upstash
 *   - Per-message: 5000 chars max (~1000 words)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Body = {
  name?: string;
  role?: string;
  company?: string;
  email?: string;
  stage?: string;
  message?: string;
  lang?: "hr" | "en";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_CHARS = 5000;

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
  if (ratelimit) {
    const ip = getClientIp(req);
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return res.status(429).json({
        error: "Too many submissions. Please try again tomorrow, or email directly.",
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
    return res.status(500).json({ error: "Could not deliver the message. Please try again, or email directly." });
  }
  if (notifyResult.value.error) {
    console.error("Resend notify error:", notifyResult.value.error);
    return res.status(502).json({ error: "Could not deliver the message. Please try again, or email directly." });
  }

  return res.status(200).json({ ok: true });
}
