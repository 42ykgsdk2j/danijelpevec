/**
 * Blog Q&A chat endpoint.
 *
 * Receives a UIMessage array from @ai-sdk/react's useChat hook along with
 * the blog post's title, body, and lang. Calls Claude Haiku 4.5 via Vercel
 * AI Gateway with a system prompt that grounds the model in the post.
 *
 * Required env var: AI_GATEWAY_API_KEY (or VERCEL_OIDC_TOKEN from the
 * Vercel OIDC integration — gateway() picks up either).
 */
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";

export const config = {
  runtime: "edge",
};

const BodySchema = z.object({
  messages: z.array(z.any()).min(1).max(40),
  postTitle: z.string().min(1).max(300),
  postBody: z.string().min(50).max(40000),
  lang: z.enum(["hr", "en"]),
});

export default async function handler(req: Request): Promise<Response> {
  console.log("[chat] invoked, method:", req.method);

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
    });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
    console.log("[chat] body parsed, lang:", body.lang, "messages:", body.messages.length);
  } catch (err) {
    console.error("[chat] body parse error:", err);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, postTitle, postBody, lang } = body;

  const systemPrompt =
    lang === "hr"
      ? `JEZIK ODGOVORA: HRVATSKI. Svi odgovori MORAJU biti isključivo na hrvatskom jeziku, bez iznimke. Čak i ako je korisnikovo pitanje na engleskom ili drugom jeziku — vi odgovarate na hrvatskom.

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

PODSJETNIK: Pišite isključivo na hrvatskom jeziku. Ne prelazite na engleski ni u jednom dijelu odgovora.`
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

REMINDER: Write in English only. Do not switch languages at any point in your response.`;

  try {
    console.log("[chat] calling streamText with model anthropic/claude-haiku-4-5");
    const result = streamText({
      model: "anthropic/claude-haiku-4-5",
      system: systemPrompt,
      messages: convertToModelMessages(messages as UIMessage[]),
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
