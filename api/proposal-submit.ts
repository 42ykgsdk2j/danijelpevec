/**
 * Sends a proposal drafted on the contact page (ContactStudio.tsx).
 *
 *   1. Notifies Danijel (+ CC) with the structured proposal and the full
 *      chat transcript (must-succeed)
 *   2. Sends the visitor a personal acknowledgment with a copy of what
 *      they sent, in their language (best-effort)
 *
 * Uses the same env vars as api/contact.ts: RESEND_API_KEY,
 * CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, CONTACT_CC_EMAIL, the three
 * RECAPTCHA_* vars (check skipped when any is unset) and the Upstash
 * KV_* vars (rate limit skipped when unset).
 *
 * Misuse caps:
 *   - Per-IP: 5 submissions / 24h sliding window (shared budget with
 *     nothing else — prefix "proposal-submit")
 *   - reCAPTCHA Enterprise score gate, action "proposal_form"
 *   - Payload shape + lengths enforced by submitSchema
 */
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  submitSchema,
  type Contact,
  type Draft,
  type Transcript,
} from "../src/lib/proposalSchema.js";

// Node, not edge: resend pulls in html-to-text → htmlparser2, which the
// edge runtime can't load. The `.js` specifier resolves to the .ts source
// for the type-checker and to the compiled file at run time (ESM).

const RECAPTCHA_MIN_SCORE = 0.3;
const RECAPTCHA_ACTION = "proposal_form";

let ratelimit: Ratelimit | null = null;
try {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 d"),
    analytics: true,
    prefix: "proposal-submit",
  });
} catch (err) {
  console.warn("[proposal-submit] rate limiting disabled (Upstash env missing):", err);
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

const LABELS = {
  en: {
    engagement: {
      "private-advisory": "Private advisory",
      "family-sessions": "Family business sessions",
      "long-term": "Long-term advisory relationship",
      "not-sure": "Not sure yet",
    },
    situation: "Situation",
    role: "Role",
    stage: "Stage",
    decisions: "Key decisions",
    people: "Who is involved",
    goals: "A good outcome",
    timing: "Timing",
    sensitivities: "Worth knowing",
    openQuestions: "For the first conversation",
  },
  hr: {
    engagement: {
      "private-advisory": "Privatno savjetovanje",
      "family-sessions": "Sastanci s obitelji",
      "long-term": "Dugoročna savjetodavna suradnja",
      "not-sure": "Još nije jasno",
    },
    situation: "Situacija",
    role: "Uloga",
    stage: "Faza",
    decisions: "Ključne odluke",
    people: "Tko je uključen",
    goals: "Dobar ishod",
    timing: "Vremenski okvir",
    sensitivities: "Važno je znati",
    openQuestions: "Za prvi razgovor",
  },
} as const;

type Lang = keyof typeof LABELS;

function sections(draft: Draft, lang: Lang): [string, string | string[] | undefined][] {
  const l = LABELS[lang];
  return [
    [l.situation, draft.situation],
    [l.role, draft.role],
    [l.stage, draft.stage],
    [l.decisions, draft.decisions],
    [l.people, draft.people],
    [l.goals, draft.goals],
    [l.timing, draft.timing],
    [l.sensitivities, draft.sensitivities],
    [l.openQuestions, draft.openQuestions],
  ];
}

const filled = ([, v]: [string, string | string[] | undefined]) =>
  Array.isArray(v) ? v.length > 0 : Boolean(v);

function draftText(draft: Draft, lang: Lang) {
  return sections(draft, lang)
    .filter(filled)
    .map(([label, v]) => `${label.toUpperCase()}\n${Array.isArray(v) ? v.map((i) => `- ${i}`).join("\n") : v}`)
    .join("\n\n");
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function draftHtml(draft: Draft, lang: Lang) {
  return sections(draft, lang)
    .filter(filled)
    .map(([label, v]) => {
      const body = Array.isArray(v)
        ? `<ul style="margin:4px 0 0;padding-left:18px">${v.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
        : `<p style="margin:4px 0 0;white-space:pre-wrap">${esc(v as string)}</p>`;
      return `<h3 style="margin:22px 0 0;font:500 11px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#8a7340">${esc(label)}</h3>${body}`;
    })
    .join("");
}

// Section labels follow the visitor's language, matching the draft text
// the assistant wrote with them.
function ownerEmail(draft: Draft, contact: Contact, transcript: Transcript, lang: Lang) {
  const engagement = LABELS[lang].engagement[draft.engagement];
  const who = [contact.name, contact.company].filter(Boolean).join(", ");
  const meta = `${engagement} · ${lang.toUpperCase()} · readiness ${draft.completeness}%`;
  const contactLines = [
    `${contact.name} <${contact.email}>`,
    contact.company ? contact.company : null,
    contact.phone ? contact.phone : null,
  ].filter((x): x is string => Boolean(x));
  const transcriptHtml = transcript
    .map(
      (t) =>
        `<p style="margin:8px 0;white-space:pre-wrap"><strong>${t.role === "user" ? esc(contact.name) : "Assistant"}:</strong> ${esc(t.text)}</p>`,
    )
    .join("");

  return {
    subject: `Proposal — ${draft.title} (${who})`,
    html: `<div style="font-family:Georgia,'Times New Roman',serif;max-width:640px;margin:0 auto;color:#0a1628;line-height:1.6">
<p style="margin:0;font:13px -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#4a5a6e">${esc(meta)}</p>
<h2 style="margin:6px 0 4px;font-weight:500">${esc(draft.title)}</h2>
<p style="margin:0;font:14px -apple-system,Segoe UI,Helvetica,Arial,sans-serif">${contactLines.map(esc).join("<br/>")}</p>
<div style="font:15px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif">${draftHtml(draft, lang)}</div>
<hr style="margin:28px 0;border:none;border-top:1px solid #e0d6bd"/>
<details style="font:14px -apple-system,Segoe UI,Helvetica,Arial,sans-serif"><summary style="cursor:pointer;color:#4a5a6e">Conversation transcript</summary>${transcriptHtml}</details>
</div>`,
    text: `New proposal from danijelpevec.com\n${meta}\n\n${draft.title}\n${contactLines.join("\n")}\n\n${draftText(draft, lang)}\n\n---\nTRANSCRIPT\n${transcript
      .map((t) => `${t.role === "user" ? contact.name : "Assistant"}: ${t.text}`)
      .join("\n\n")}`,
  };
}

// Plain text and written as a personal note, like the contact form's
// acknowledgment, so mail clients file it as correspondence.
function ackEmail(draft: Draft, contact: Contact, lang: Lang) {
  const engagement = LABELS[lang].engagement[draft.engagement];
  if (lang === "en") {
    return {
      subject: `Your proposal: ${draft.title}`,
      text: `Dear ${contact.name},

Thank you for taking the time to put this in writing. I'll read your proposal personally and get back to you with a suggestion for a first private conversation.

If anything changes in the meantime, simply reply to this email.

— Danijel Pevec

---
What you sent

${draft.title} (${engagement})

${draftText(draft, lang)}
`,
    };
  }
  return {
    subject: `Vaš prijedlog: ${draft.title}`,
    text: `Poštovani/a ${contact.name},

hvala što ste odvojili vrijeme da ovo zapišete. Osobno ću pročitati Vaš prijedlog i javiti Vam se s prijedlogom termina za prvi privatni razgovor.

Ako se u međuvremenu nešto promijeni, jednostavno odgovorite na ovaj email.

— Danijel Pevec

---
Što ste poslali

${draft.title} (${engagement})

${draftText(draft, lang)}
`,
  };
}

interface EnterpriseAssessment {
  tokenProperties?: { valid: boolean; invalidReason?: string; action?: string };
  riskAnalysis?: { score?: number; reasons?: string[] };
  error?: { code: number; message: string; status: string };
}

async function recaptchaPasses(token: string | undefined): Promise<"ok" | "rejected" | "unavailable"> {
  const apiKey = process.env.RECAPTCHA_SECRET_KEY; // Cloud API key — see api/contact.ts
  const projectId = process.env.RECAPTCHA_PROJECT_ID;
  const siteKey = process.env.RECAPTCHA_SITE_KEY;
  if (!apiKey || !projectId || !siteKey) return "ok";
  if (!token) return "rejected";
  try {
    const res = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/assessments?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: { token, siteKey, expectedAction: RECAPTCHA_ACTION } }),
      },
    );
    const a = (await res.json()) as EnterpriseAssessment;
    const score = a.riskAnalysis?.score ?? 0;
    if (
      a.tokenProperties?.valid !== true ||
      a.tokenProperties.action !== RECAPTCHA_ACTION ||
      score < RECAPTCHA_MIN_SCORE ||
      a.error
    ) {
      console.warn("[proposal-submit] reCAPTCHA rejected:", {
        score,
        action: a.tokenProperties?.action,
        invalidReason: a.tokenProperties?.invalidReason,
        reasons: a.riskAnalysis?.reasons,
        error: a.error,
      });
      return "rejected";
    }
    return "ok";
  } catch (err) {
    console.error("[proposal-submit] reCAPTCHA verify error:", err);
    // Fail closed, same as the contact form.
    return "unavailable";
  }
}

export async function POST(req: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { error: "invalid" });
  }
  const parsed = submitSchema.safeParse(raw);
  if (!parsed.success) {
    // The client maps "name" / "email" to localised field errors.
    const field = parsed.error.issues[0]?.message;
    return json(400, { error: field === "name" || field === "email" ? field : "invalid" });
  }
  const { draft, contact, transcript, lang, recaptchaToken } = parsed.data;

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!resendApiKey || !from) {
    console.error("[proposal-submit] Missing RESEND_API_KEY or CONTACT_FROM_EMAIL");
    return json(500, { error: "unavailable" });
  }
  const to = process.env.CONTACT_TO_EMAIL || "danijel@danijelpevec.com";
  const cc = (process.env.CONTACT_CC_EMAIL || "anna@danijelpevec.com")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(getClientIp(req));
      if (!success) return json(429, { error: "limit" });
    } catch (err) {
      console.warn("[proposal-submit] rate limit check failed, allowing through:", err);
    }
  }

  const human = await recaptchaPasses(recaptchaToken);
  if (human === "rejected") return json(403, { error: "bot" });
  if (human === "unavailable") return json(503, { error: "unavailable" });

  const resend = new Resend(resendApiKey);
  const owner = ownerEmail(draft, contact, transcript, lang);
  const { error } = await resend.emails.send({ from, to, cc, replyTo: contact.email, ...owner });
  if (error) {
    console.error("[proposal-submit] Resend notify error:", error);
    return json(502, { error: "send" });
  }

  // The proposal reached the practice; a failed acknowledgment must not
  // fail the submission.
  const ack = ackEmail(draft, contact, lang);
  const { error: ackError } = await resend.emails.send({ from, to: contact.email, replyTo: to, ...ack });
  if (ackError) console.error("[proposal-submit] Resend ack error (non-fatal):", ackError);

  return json(200, { ok: true });
}
