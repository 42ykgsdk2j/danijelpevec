/**
 * The structured proposal the contact-page assistant builds up while it
 * talks with a visitor (api/proposal.ts), and the payload the visitor
 * sends at the end (api/proposal-submit.ts).
 *
 * Server-only: the ContactStudio island imports the *types* from here
 * (`import type`) so zod never reaches the client bundle.
 */
import { z } from "zod";

// Mirrors the three services in the "How we work together" section
// (work.services in the i18n JSON), plus an honest "not sure yet".
export const ENGAGEMENTS = [
  "private-advisory",
  "family-sessions",
  "long-term",
  "not-sure",
] as const;

export type Engagement = (typeof ENGAGEMENTS)[number];

const short = (max: number) => z.string().trim().max(max);

export const draftSchema = z.object({
  engagement: z
    .enum(ENGAGEMENTS)
    .describe(
      "Which form of work fits best: private-advisory (one-on-one on key decisions), family-sessions (structured discussions with family members), long-term (ongoing support through growth, transition, generational change), or not-sure",
    ),
  title: short(120).describe("A short, specific title for the proposal, in the conversation language"),
  situation: short(1200).describe(
    "Two to four sentences: the business, the family, and what is happening now that prompts this",
  ),
  role: short(160)
    .optional()
    .describe("The visitor's role (founder, next-generation leader, family member…), in the conversation language"),
  stage: short(160)
    .optional()
    .describe("Where they are in the transition, as a short phrase in the conversation language"),
  decisions: z.array(short(240)).max(8).describe("The key decisions or questions they face"),
  people: short(600)
    .optional()
    .describe("Who is involved: generations, family members, partners, who decides"),
  goals: z.array(short(240)).max(8).describe("What a good outcome would look like for them"),
  timing: short(240).optional().describe("Urgency, deadlines or events driving the timing"),
  sensitivities: short(600)
    .optional()
    .describe("Sensitivities or constraints worth knowing before a first conversation"),
  openQuestions: z
    .array(short(240))
    .max(8)
    .describe("Things still unclear that are best explored in the first private conversation"),
  completeness: z.number().int().min(0).max(100).describe("How ready the proposal is to send, 0-100"),
});

export type Draft = z.infer<typeof draftSchema>;

export const contactSchema = z.object({
  name: short(120).min(1, "name"),
  email: z.email("email").max(200),
  company: short(160).optional(),
  phone: short(40).optional(),
});

export type Contact = z.infer<typeof contactSchema>;

export const transcriptSchema = z
  .array(z.object({ role: z.enum(["user", "assistant"]), text: short(4000) }))
  .max(60);

export type Transcript = z.infer<typeof transcriptSchema>;

export const submitSchema = z.object({
  draft: draftSchema,
  contact: contactSchema,
  transcript: transcriptSchema,
  lang: z.enum(["hr", "en"]),
  recaptchaToken: z.string().max(4096).optional(),
});
