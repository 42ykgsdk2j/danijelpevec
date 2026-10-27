import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { BUSINESS, SITE, getT, type Lang } from "../lib/i18n";
import { langOf, slugOf } from "../content.config";

/**
 * /llms.txt (llmstxt.org): a short markdown map of the site for AI tools.
 * Built from the blog collection, so new posts appear on the next build.
 * Facts about Danijel come only from copy already on the site.
 */
export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog")).sort((a, b) => b.data.date.localeCompare(a.data.date));
  const en = getT("en");

  const postLinks = (lang: Lang) =>
    posts
      .filter((p) => langOf(p.id) === lang)
      .map((p) => {
        const path = lang === "hr" ? `/blog/${slugOf(p.id)}/` : `/en/blog/${slugOf(p.id)}/`;
        return `- [${p.data.title}](${SITE}${path}): ${p.data.excerpt}`;
      });

  const lines = [
    `# ${BUSINESS.personName} — ${BUSINESS.jobTitle.en}`,
    "",
    `> ${BUSINESS.description.en}`,
    "",
    `${BUSINESS.personName} is a family business advisor based in ${BUSINESS.address.addressLocality}, Croatia, ` +
      `practising as "${BUSINESS.practiceName}". Danijel works with founders and their families on the ` +
      "decisions that shape what comes next, drawing on experience as an advisor, as a founder, and as part " +
      "of a next-generation family business. The site is bilingual: Croatian at the root, English under /en/.",
    "",
    "## English",
    "",
    `- [Home](${SITE}/en/): ${BUSINESS.description.en}`,
    `- [Blog](${SITE}/en/blog/): ${en.blog.pageLead}`,
    `- [Family Business Readiness Assessment](${SITE}/en/assessment/): Transition readiness across six dimensions. No registration, instant results.`,
    "",
    "## English articles",
    "",
    ...postLinks("en"),
    "",
    "## Hrvatski",
    "",
    `- [Početna](${SITE}/): ${BUSINESS.description.hr}`,
    `- [Objave](${SITE}/blog/): ${getT("hr").blog.pageLead}`,
    `- [Procjena spremnosti obiteljskog biznisa](${SITE}/assessment/): Spremnost za tranziciju u šest dimenzija. Bez registracije, trenutni rezultati.`,
    "",
    "## Članci na hrvatskom",
    "",
    ...postLinks("hr"),
    "",
    "## Contact",
    "",
    `- Email: ${BUSINESS.email}`,
    `- LinkedIn: ${BUSINESS.sameAs[0]}`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
