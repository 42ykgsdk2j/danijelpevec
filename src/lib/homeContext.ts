/**
 * Composes the grounding text passed to /api/chat as `postBody` when the
 * Chat component runs in mode="home". Pulls the relevant copy from the
 * locale-specific i18n JSON so the chat stays in sync with what's visible
 * on the home page — no second source of truth.
 *
 * The composed string is plain text with section headers; the model treats
 * it as the canonical reference for answering questions about Danijel's
 * services, who he works with, and how he works.
 */
import type { Lang } from "./i18n";
import hr from "../data/hr.json";
import en from "../data/en.json";

type HomeStrings = typeof hr;

function compose(t: HomeStrings, lang: Lang): string {
  const sep = "\n\n";
  const lines: string[] = [];

  const heroSubtitle =
    `${t.hero.headlineA} ${t.hero.headlineB} ${t.hero.headlineC} ${t.hero.headlineD}`;
  lines.push(`# ${lang === "hr" ? "POZICIONIRANJE" : "POSITIONING"}`);
  lines.push(heroSubtitle);
  lines.push(t.hero.sub);

  lines.push(`# ${t.who.eyebrow}`);
  lines.push(`${t.who.title} ${t.who.titleAccent}`);
  lines.push(t.who.lead);
  lines.push(...t.who.items.map((s) => `- ${s}`));

  lines.push(`# ${t.challenges.eyebrow}`);
  lines.push(`${t.challenges.title} ${t.challenges.titleAccent}`);
  lines.push(t.challenges.lead);
  lines.push(...t.challenges.items.map((it) => `- ${it.text}`));

  lines.push(`# ${t.approach.eyebrow}`);
  lines.push(`${t.approach.quoteA} ${t.approach.quoteAccent} ${t.approach.quoteB}`);
  lines.push(...t.approach.items.map((s) => `- ${s}`));
  lines.push(t.approach.coda);

  lines.push(`# ${t.work.eyebrow}`);
  lines.push(`${t.work.title} ${t.work.titleAccent}`);
  lines.push(t.work.lead);
  lines.push(
    ...t.work.services.map((s) => `- ${s.title}: ${s.desc}`),
  );
  lines.push(`${t.work.ctaText} ${t.work.ctaAccent}`);

  lines.push(`# ${t.about.eyebrow} — ${t.about.name} (${t.about.role})`);
  lines.push(t.about.lead);
  lines.push(t.about.p1);
  lines.push(t.about.p2);
  lines.push(`"${t.about.pull}"`);
  lines.push(t.about.p3);
  lines.push(t.about.p4);
  lines.push(t.about.closing);

  return lines.join(sep);
}

export function getHomeContext(lang: Lang): { title: string; body: string } {
  const t = lang === "hr" ? hr : en;
  const title =
    lang === "hr"
      ? "Danijel Pevec — usluge, pristup i s kim radi (sažetak početne stranice)"
      : "Danijel Pevec — services, approach, and who he works with (home-page summary)";
  return { title, body: compose(t, lang) };
}
