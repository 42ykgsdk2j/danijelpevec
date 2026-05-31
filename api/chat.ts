/**
 * Blog Q&A chat endpoint.
 *
 * Receives a UIMessage array from @ai-sdk/react's useChat hook along with
 * the blog post's title, body, and lang. Calls the selected model via
 * Vercel AI Gateway with a system prompt that grounds the model in the post.
 *
 * Required env vars:
 *   - AI_GATEWAY_API_KEY (or VERCEL_OIDC_TOKEN from the AI Gateway integration)
 *   - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (auto-injected by
 *     Vercel's Upstash integration) — optional; rate limiting is skipped if absent.
 *
 * Misuse caps:
 *   - Per-response: maxOutputTokens 1200 (~10 paragraphs)
 *   - Per-question: user message ≤ 1000 chars
 *   - Per-conversation: 15 messages, then canned "continue privately" reply
 *   - Per-IP: 20 questions / 24h sliding window via Upstash
 */
import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const config = {
  runtime: "edge",
};

const BodySchema = z.object({
  messages: z.array(z.any()).min(1).max(40),
  postTitle: z.string().min(1).max(300),
  postBody: z.string().min(50).max(40000),
  lang: z.enum(["hr", "en"]),
  // "blog" = grounded in a single article (default). "home" = grounded in
  // the home-page services summary; system prompt is broader and points
  // users to "Request a private conversation" rather than the article
  // page's bottom CTA.
  mode: z.enum(["blog", "home"]).optional().default("blog"),
});

const MAX_USER_MESSAGE_CHARS = 1000;
const MAX_CONVERSATION_MESSAGES = 15;
const MAX_OUTPUT_TOKENS = 1200;

let ratelimit: Ratelimit | null = null;
try {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, "1 d"),
    analytics: true,
    prefix: "chat",
  });
} catch (err) {
  console.warn("[chat] rate limiting disabled (Upstash env missing):", err);
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

function cannedReply(text: string): Response {
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const id = "canned";
      writer.write({ type: "start" });
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: text });
      writer.write({ type: "text-end", id });
    },
  });
  return createUIMessageStreamResponse({ stream });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
    });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    console.error("[chat] body parse error:", err);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, postTitle, postBody, lang, mode } = body;
  const langIsHr = lang === "hr";
  const isHome = mode === "home";

  // Per-IP rate limit
  if (ratelimit) {
    const ip = getClientIp(req);
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return cannedReply(
        langIsHr
          ? "Dosegnuli ste dnevni limit pitanja za ovu objavu. Vratite se sutra ili koristite gumb 'Zatraži privatni razgovor' u dnu članka za izravan razgovor."
          : "You've reached today's question limit for this post. Come back tomorrow, or use the 'Request a private conversation' button at the bottom of the article for a direct conversation.",
      );
    }
  }

  // Per-question input cap (check the last user message)
  const lastUser = [...messages].reverse().find(
    (m: unknown) => typeof m === "object" && m !== null && (m as { role?: string }).role === "user",
  ) as { parts?: Array<{ type?: string; text?: string }> } | undefined;
  const userText = (lastUser?.parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
  if (userText.length > MAX_USER_MESSAGE_CHARS) {
    return cannedReply(
      langIsHr
        ? `Vaše pitanje je predugačko (više od ${MAX_USER_MESSAGE_CHARS} znakova). Skratite ga ili koristite 'Zatraži privatni razgovor' za detaljniju raspravu.`
        : `Your question is too long (over ${MAX_USER_MESSAGE_CHARS} characters). Please shorten it, or use 'Request a private conversation' for a deeper discussion.`,
    );
  }

  // Per-conversation length cap
  if (messages.length > MAX_CONVERSATION_MESSAGES) {
    return cannedReply(
      langIsHr
        ? "Ovaj razgovor je već dug. Za detaljniju raspravu, predlažem privatni razgovor — koristite gumb 'Zatraži privatni razgovor' u dnu članka ili u izborniku."
        : "This conversation has grown long. For a deeper discussion, let's continue privately — use the 'Request a private conversation' button at the bottom of the article or in the menu.",
    );
  }

  // Two grounding modes:
  //   - blog: classic per-post Q&A (BlogChat on /blog/<slug>/ pages)
  //   - home: services-level Q&A grounded in a curated home-page summary
  //     (HomeChat on /). Same shape; different framing + cross-link copy.
  const systemPrompt = langIsHr
    ? (isHome
      ? `JEZIK ODGOVORA: HRVATSKI. Svi odgovori MORAJU biti isključivo na hrvatskom jeziku, bez iznimke. Čak i ako je korisnikovo pitanje na engleskom ili drugom jeziku — vi odgovarate na hrvatskom.

Vi ste AI asistent na početnoj stranici Danijela Pevca, savjetnika za obiteljski biznis. Odgovarate na pitanja o tome s kim radi, kako radi i koje usluge nudi.

KONTEKST: ${postTitle}

SADRŽAJ:
${postBody}

UPUTE:
- Odgovore temeljite na kontekstu iznad.
- Budite kratki i konkretni (2-4 rečenice za većinu pitanja).
- Za osobne savjete uvijek uputite na gumb "Zatraži privatni razgovor" na stranici.
- Ne dajite osobne financijske, pravne ili porezne savjete — predložite privatni razgovor s Danijelom.
- Ne izmišljajte podatke koji nisu u kontekstu iznad.
- VAŽNO — sklonidba prezimena Pevec: kod sklonidbe ZADRŽITE slovo "e". Ispravno: Peveca, Pevecu, Peveca, Peveče, Pevecu, Pevecom. POGREŠNO: Pevca, Pevcu, Pevče, Pevcom. Primjer: "Prema Danijelu Pevecu…" (a NE "Prema Danijelu Pevcu").
- TON I PERSPEKTIVA: NE govorite o Danijelu u trećem licu i NE ponavljajte njegovo ime kad opisujete usluge, pristup, način rada ili procese. Govorite izravno o samom radu, kao da ste glas same prakse. Primjeri:
  • DOBRO: "Način rada prilagođen je svakoj obitelji pojedinačno."
  • LOŠE: "Način rada s Danijelom Pevecom prilagođen je svakoj obitelji."
  • DOBRO: "U razgovorima se ide do ključnih odluka."
  • LOŠE: "Danijel u razgovorima ide do ključnih odluka."
  • DOBRO: "Ako ste spremni graditi nasljeđe koje nadilazi trenutni kvartal, zatražite privatni razgovor kako bismo utvrdili je li ovaj pristup pravi za vašu situaciju."
  • LOŠE: "...zatražite privatni razgovor s Danijelom Pevecom kako bismo utvrdili..."
  Čitatelj je već na njegovoj stranici i zna čiji je rad u pitanju — atribucija nije potrebna. Naziv ponude je samo "Privatni razgovor" — NIKAD ne dodavajte ime uz taj naziv ("s Danijelom", "s Danijelom Pevecom" itd.). Ime spomenite samo ako korisnik eksplicitno pita tko stoji iza rada.

PODSJETNIK: Pišite isključivo na hrvatskom jeziku. Ne prelazite na engleski ni u jednom dijelu odgovora.`
      : `JEZIK ODGOVORA: HRVATSKI. Svi odgovori MORAJU biti isključivo na hrvatskom jeziku, bez iznimke. Čak i ako je korisnikovo pitanje na engleskom ili drugom jeziku — vi odgovarate na hrvatskom.

Vi ste asistent koji odgovara na pitanja o blog objavi Danijela Pevca, savjetnika za obiteljski biznis.

NASLOV OBJAVE: ${postTitle}

SADRŽAJ OBJAVE:
${postBody}

UPUTE:
- Odgovore temeljite isključivo na sadržaju objave iznad.
- Budite kratki i konkretni (2-4 rečenice za većinu pitanja).
- Ako pitanje nije pokriveno objavom, kažite to iskreno i predložite "Zatraži privatni razgovor" na stranici.
- Ne dajite osobne financijske, pravne ili porezne savjete — predložite konzultaciju.
- Ne izmišljajte podatke koje objava ne sadrži.
- VAŽNO — sklonidba prezimena Pevec: kod sklonidbe ZADRŽITE slovo "e". Ispravno: Peveca, Pevecu, Peveca, Peveče, Pevecu, Pevecom. POGREŠNO: Pevca, Pevcu, Pevče, Pevcom. Primjer: "Prema Danijelu Pevecu, ova objava…" (a NE "Prema Danijelu Pevcu").

PODSJETNIK: Pišite isključivo na hrvatskom jeziku. Ne prelazite na engleski ni u jednom dijelu odgovora.`)
    : (isHome
      ? `RESPONSE LANGUAGE: ENGLISH. All responses MUST be in English only, no exceptions. Even if the user writes in Croatian or another language — you reply in English.

You are an AI assistant on Danijel Pevec's home page. Danijel is a family business advisor. You answer questions about who he works with, how he works, and what services he offers.

CONTEXT: ${postTitle}

CONTENT:
${postBody}

INSTRUCTIONS:
- Base answers on the context above.
- Be concise (2-4 sentences for most questions).
- For personal advice, always direct users to the "Request a private conversation" button on the page.
- Don't give personal financial, legal, or tax advice — suggest a private conversation with Danijel.
- Don't fabricate details not in the context above.
- TONE & PERSPECTIVE: Do NOT speak about Danijel in the third person and do NOT repeat his name when describing services, approach, process, or how the work is done. Speak directly about the work itself, as the voice of the practice. Examples:
  • GOOD: "The approach is tailored to each family individually."
  • BAD: "Working with Danijel Pevec is tailored to each family."
  • GOOD: "Conversations go straight to the decisions that matter."
  • BAD: "Danijel takes conversations straight to the decisions that matter."
  • GOOD: "If you're ready to build a legacy that outlasts the current quarter, request a private conversation to see if this approach is right for your situation."
  • BAD: "...request a private conversation with Danijel Pevec to see if this approach is right..."
  The reader is already on his page and knows whose work this is — attribution isn't needed. The offering is named simply "Private conversation" — NEVER append the name to it ("with Danijel", "with Danijel Pevec", etc.). Mention his name only if the user explicitly asks who stands behind the work.

REMINDER: Write in English only. Do not switch languages at any point in your response.`
      : `RESPONSE LANGUAGE: ENGLISH. All responses MUST be in English only, no exceptions. Even if the user writes in Croatian or another language — you reply in English.

You are an assistant answering questions about a blog post by Danijel Pevec, family business advisor.

POST TITLE: ${postTitle}

POST CONTENT:
${postBody}

INSTRUCTIONS:
- Base answers strictly on the post content above.
- Be concise (2-4 sentences for most questions).
- If the question isn't covered by the post, say so honestly and point readers to the "Request a private conversation" button on the page.
- Don't give personal financial, legal, or tax advice — suggest a consultation.
- Don't fabricate details not in the post.

REMINDER: Write in English only. Do not switch languages at any point in your response.`);

  try {
    const result = streamText({
      model: "google/gemini-3.1-flash-lite",
      system: systemPrompt,
      messages: convertToModelMessages(messages as UIMessage[]),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      onError: ({ error }) => {
        console.error("[chat] streamText onError:", error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[chat] streamText threw:", err);
    return new Response(JSON.stringify({ error: "Model call failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
