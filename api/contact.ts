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
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

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
  if (message.length < 10) return res.status(400).json({ error: "Please share a few sentences about your situation." });

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

  const ackSubject = lang === "en" ? "Thank you — received" : "Hvala — primljeno";
  const ackText =
    lang === "en"
      ? `Hi ${name},\n\nThank you for your message. I'll read it personally and get back to you.\n\n— Danijel Pevec`
      : `Poštovani/a ${name},\n\nHvala na poruci. Osobno ću je pročitati i javiti Vam se povratno.\n\n— Danijel Pevec`;

  try {
    const notify = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Private conversation request — ${name}`,
      text: internalText,
    });
    if (notify.error) {
      console.error("Resend notify error:", notify.error);
      return res.status(502).json({ error: "Could not deliver the message. Please try again, or email directly." });
    }
  } catch (err) {
    console.error("Resend notify exception:", err);
    return res.status(500).json({ error: "Could not deliver the message. Please try again, or email directly." });
  }

  resend.emails
    .send({ from, to: email, replyTo: to, subject: ackSubject, text: ackText })
    .catch((err) => console.error("Resend ack error (non-fatal):", err));

  return res.status(200).json({ ok: true });
}
