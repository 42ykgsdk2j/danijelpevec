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

const BodySchema = z.object({
  messages: z.array(z.any()).min(1).max(40),
  postTitle: z.string().min(1).max(300),
  postBody: z.string().min(50).max(40000),
  lang: z.enum(["hr", "en"]),
});

export const POST = async (req: Request): Promise<Response> => {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, postTitle, postBody, lang } = body;

  const systemPrompt =
    lang === "hr"
      ? `Vi ste asistent koji odgovara na pitanja o blog objavi Danijela Pevca, savjetnika za obiteljski biznis.

NASLOV OBJAVE: ${postTitle}

SADRŽAJ OBJAVE:
${postBody}

UPUTE:
- Odgovarajte na hrvatskom jeziku.
- Odgovore temeljite isključivo na sadržaju objave iznad.
- Budite kratki i konkretni (2-4 rečenice za većinu pitanja).
- Ako pitanje nije pokriveno objavom, kažite to iskreno i predložite "Zatraži privatni razgovor" na stranici.
- Ne dajite osobne financijske, pravne ili porezne savjete — predložite konzultaciju.
- Ne izmišljajte podatke koje objava ne sadrži.`
      : `You are an assistant answering questions about a blog post by Danijel Pevec, family business advisor.

POST TITLE: ${postTitle}

POST CONTENT:
${postBody}

INSTRUCTIONS:
- Respond in English.
- Base answers strictly on the post content above.
- Be concise (2-4 sentences for most questions).
- If the question isn't covered by the post, say so honestly and point readers to the "Request a private conversation" button on the page.
- Don't give personal financial, legal, or tax advice — suggest a consultation.
- Don't fabricate details not in the post.`;

  const result = streamText({
    model: "anthropic/claude-haiku-4-5",
    system: systemPrompt,
    messages: convertToModelMessages(messages as UIMessage[]),
  });

  return result.toUIMessageStreamResponse();
};
