# SEO / GEO improvements — handoff brief

Brief for a follow-up coding session on `danijelpevec.com` (Astro 5, static output, Vercel,
bilingual: Croatian at `/`, English at `/en/`). It comes from an audit done by reading the
code only. The live site was not reachable from the audit session, so speed, indexing and
bot blocking were **not** verified.

GEO = Generative Engine Optimization: getting the site quoted and cited by AI answer engines
(ChatGPT, Perplexity, Google AI Overviews, Claude).

## Current state (already good — don't redo)

- Every page is built to plain HTML, so AI crawlers that don't run JavaScript can read it.
- `src/layouts/BaseLayout.astro`: title, description, canonical, hreflang (`hr`, `en`,
  `x-default` → HR), Open Graph, Twitter tags, and robots `max-snippet:-1`.
- `astro.config.mjs`: the sitemap pairs HR/EN alternates, including blog posts with
  translated slugs (via `src/lib/blogAlternates.mjs`, keyed on the `translationKey`
  frontmatter field).
- `public/robots.txt` allows all bots; only `/admin/` and `/api/` are blocked.
- `src/lib/seo.ts`: JSON-LD for `Person` (`${SITE}/#danijel`), `ProfessionalService`
  (`${SITE}/#practice`) and `WebSite` (one per language), used on both home pages.
- `src/pages/blog/[slug].astro` (HR) and `src/pages/en/blog/[slug].astro` (EN) each emit
  `BlogPosting` JSON-LD. **These two files are near-duplicates. Apply every change to both.**
- Posts (`src/content/blog/{hr,en}/*.md`) are 900–1,450 words, use H2/H3 structure and
  question-style titles, and 18 of 22 end with an FAQ block.

## Tasks for this session (code)

Work on a feature branch. Run `npm run build` after the changes and inspect the JSON-LD in
`dist/**/index.html`. Keep the HR and EN versions in sync.

### 1. Connect the blog author and publisher to the site's existing entities
In both `[slug].astro` files, the `BlogPosting` currently uses a plain `author` Person and a
separate `publisher` Organization named "Family Business by Danijel Pevec", with
`og-image.png` as its logo. That leaves three disconnected entities.
- `author`: add `"@id": "${SITE}/#danijel"` (keep `name` and `url`). Point `url` at the
  home page in the post's language.
- `publisher`: reference `{ "@id": "${SITE}/#practice" }`, or keep the inline object but add
  that `@id` and make the name match `BUSINESS.practiceName` in `src/lib/i18n.ts`.
- Logo: Google wants a raster logo, square-ish and at least 112×112. Only
  `public/favicon.svg` and the 1200×630 `og-image.png` exist. If no proper logo exists, leave
  a TODO and tell the user a square PNG logo is needed. Don't fabricate one.
- Consider moving the BlogPosting builder into `src/lib/seo.ts` (e.g.
  `blogPostingJsonLd(post, lang, url)`) so the two templates don't drift.

### 2. FAQPage structured data from the existing FAQ blocks
FAQs are raw HTML inside the markdown body, in this format:
```html
<section class="article-faq">
<h2>Frequently asked questions</h2>   <!-- HR: "Često postavljana pitanja" -->
<details><summary>Question?</summary><p>Answer…</p></details>
…
</section>
```
Some posts put `<details>` on one line, others across several lines. At build time, parse
`post.body`: find the `article-faq` section, extract each summary/answer pair, and strip the
answer to plain text. If any pairs are found, add a `FAQPage` JSON-LD node
(`mainEntity: [{ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } }]`).
Put the parser in `src/lib/` and use it from both templates. Emit nothing when a post has no
FAQ.

Note: Google now shows FAQ rich results only for a few authority sites. The value here is
machine-readable Q&A for AI and other crawlers, not search snippets.

### 3. `updated` date → `dateModified`
Both templates currently set `dateModified = datePublished`.
- `src/content.config.ts`: add `updated: z.coerce.date().transform(d => d.toISOString()).optional()`.
- `public/admin/config.yml`: add an optional `datetime` field `updated` to **both**
  collections, `blog_en` and `blog_hr` (HR label: "Datum zadnje izmjene"). Same format as
  `date`, `required: false`.
- Templates: `dateModified: post.data.updated ?? post.data.date`. Optionally show
  "Updated …" / "Ažurirano …" in the article meta row when `updated` is set.
- Optionally pass `updated` as the sitemap `lastmod` (would need `blogAlternates.mjs` or a
  similar frontmatter read in `astro.config.mjs`).

### 4. Internal links between related posts
None of the 22 posts link to another post. Two options, in this order of preference:
- **Template-level "Related articles" block** at the end of each article, chosen by
  `category` and/or a new optional frontmatter list `related: [translationKey, …]`
  (add it to the schema and the CMS config). Link only to posts in the **same language**,
  using their language-specific slug. This needs no edits to post bodies.
- In-body contextual links are higher value, but they are editorial. Only add them where the
  text already names the topic of another post. Use the correct language's slug
  (HR `/blog/<hr-slug>/`, EN `/en/blog/<en-slug>/`).

### 5. `llms.txt`
Add `src/pages/llms.txt.ts` as a static endpoint that outputs the file in markdown, following
the llmstxt.org format:
- H1 with the site name and a one-line summary taken from `BUSINESS.description`;
- a short paragraph on who Danijel is, using only facts already on the site;
- link lists for the EN pages and posts (title + excerpt) and the HR pages and posts.

Generate it from `getCollection("blog")` so new posts appear automatically. Its effect is
unproven, so keep it small and don't over-invest.

### 6. Missing FAQs (flag only)
These posts have no FAQ block: EN `what-changes-during-generational-transition`, EN
`why-founders-return`, HR `sto-se-zapravo-mijenja-tijekom-generacijske-tranzicije`, HR
`zasto-se-osnivaci-vracaju-u-poduzece`. Ask the user before writing FAQ content. The answers
must reflect Danijel's views, not generic advice.

### 7. Smaller items (ask the user first)
- `areaServed: "HR"` in `businessJsonLd` (`src/lib/seo.ts`). The English content targets a
  wider audience, so ask which countries or regions to list.
- Every post shares `og-image.png`. Per-post cover images (the `cover` field already exists)
  would help. This is content work, not code.

## Content work (needs Danijel — don't invent anything)

1. **Cite sources for statistics.** No post links to any outside source. Uncited figures
   include "30% / 12% / 3% survive to the 2nd/3rd/4th generation" (`family-business-second-generation`)
   and "70% of wealth lost by the 2nd generation, 90% by the 3rd"
   (`generational-wealth-transition`, plus the HR versions). These figures are disputed in the
   research. Either cite the original studies or soften the wording.
2. **Concrete credentials.** The About copy (`src/data/en.json` / `hr.json`, key `about`) has
   no facts an AI could verify: years of experience, number of families advised, past roles,
   the Alpha Capitalis connection, qualifications, talks or publications. Add them, and
   consider `knowsAbout`, `alumniOf` and `hasCredential` in `personJsonLd`.
3. **Original material.** Add anonymised client situations, named frameworks (e.g. give the
   "five stages of succession" a name and use it consistently), and first-hand numbers.
4. **A consistent identity everywhere.** Use the same name, role and description across the
   site, LinkedIn and Google Business Profile. `sameAs` in `src/lib/i18n.ts` has a note that
   the Google Business Profile link was removed until a permanent URL is available.
5. **Mentions on other sites.** Interviews, podcasts, Croatian business press and LinkedIn
   articles build the external authority that AI engines rely on.

## Writing-for-AI checklist (for new posts)

- Open each section with a 1–2 sentence direct answer, then expand. Each passage should
  make sense if quoted alone.
- Give specific, quotable claims: numbers, timeframes, named steps.
- Phrase headings and FAQs the way a client would ask the question.
- Cite sources for factual claims and link to related posts on the site.
- Add the `updated` date when revising a post.

## Not verified (check on the live site)

- Vercel or firewall settings that block AI crawler user agents (test with
  `curl -A "GPTBot"`, `ClaudeBot`, `PerplexityBot`).
- Core Web Vitals, Google Search Console indexing and coverage, Bing Webmaster Tools.
- The PRE-LAUNCH consent mode in `BaseLayout.astro` (analytics granted by default). This is
  a GDPR issue, not SEO, but it is flagged in the code as needing to be reverted before full
  launch.
