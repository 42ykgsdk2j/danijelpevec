import { BUSINESS, SITE, type Lang } from "./i18n";
import type { FaqItem } from "./faq";

const PERSON_ID = `${SITE}/#danijel`;
const PRACTICE_ID = `${SITE}/#practice`;

export function personJsonLd(lang: Lang): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: BUSINESS.personName,
    jobTitle: BUSINESS.jobTitle[lang],
    url: lang === "hr" ? `${SITE}/` : `${SITE}/en/`,
    email: BUSINESS.email,
    telephone: BUSINESS.telephone,
    worksFor: { "@id": PRACTICE_ID },
    sameAs: BUSINESS.sameAs,
  };
}

export function businessJsonLd(lang: Lang): Record<string, unknown> {
  return { "@context": "https://schema.org", ...practiceNode(lang) };
}

/** The practice entity without @context, so it can also be nested (e.g. as a publisher). */
function practiceNode(lang: Lang): Record<string, unknown> {
  return {
    "@type": "ProfessionalService",
    "@id": PRACTICE_ID,
    name: BUSINESS.practiceName,
    description: BUSINESS.description[lang],
    url: lang === "hr" ? `${SITE}/` : `${SITE}/en/`,
    email: BUSINESS.email,
    telephone: BUSINESS.telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.streetAddress,
      postalCode: BUSINESS.address.postalCode,
      addressLocality: BUSINESS.address.addressLocality,
      addressCountry: BUSINESS.address.addressCountry,
    },
    image: `${SITE}/og-image.png`,
    areaServed: "HR",
    founder: { "@id": PERSON_ID },
    sameAs: BUSINESS.sameAs,
  };
}

export function websiteJsonLd(lang: Lang): Record<string, unknown> {
  // url + @id are per-locale so the WebSite node on /en/ doesn't claim
  // to be the apex (which is the HR canonical). Without per-locale @id
  // both home pages emitted the same WebSite node — crawlers would see
  // two pages claiming to be the same entity at the apex URL.
  const localeRoot = lang === "hr" ? `${SITE}/` : `${SITE}/en/`;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${localeRoot}#website`,
    name: BUSINESS.personName,
    url: localeRoot,
    inLanguage: lang === "hr" ? "hr-HR" : "en-GB",
    publisher: { "@id": PERSON_ID },
  };
}

interface BlogPostData {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  updated?: string;
  cover?: string;
}

/**
 * BlogPosting for an article page. Author and publisher point at the same
 * Person / ProfessionalService nodes the home pages emit (by @id), so
 * crawlers merge them into one entity instead of three loose ones.
 */
export function blogPostingJsonLd(post: BlogPostData, lang: Lang, pageUrl: string): Record<string, unknown> {
  const localeRoot = lang === "hr" ? `${SITE}/` : `${SITE}/en/`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [post.cover ? `${SITE}${post.cover}` : `${SITE}/og-image.png`],
    author: {
      "@type": "Person",
      "@id": PERSON_ID,
      name: BUSINESS.personName,
      url: localeRoot,
    },
    // Google reads an inline ProfessionalService as a local-business item
    // and flags any missing address/phone, so embed the full practice node
    // (same @id and data as the home pages) rather than a stub.
    publisher: {
      ...practiceNode(lang),
      // TODO: Google wants a square-ish raster logo (≥112×112 PNG/JPG).
      // The site has none yet — only favicon.svg and the 1200×630 OG image —
      // so the OG image stands in until a proper logo is added to /public.
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/og-image.png`,
      },
    },
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    articleSection: post.category,
    inLanguage: lang === "hr" ? "hr-HR" : "en-GB",
  };
}

/** FAQPage for a post's FAQ block, or null when it has none. */
export function faqPageJsonLd(items: FaqItem[], lang: Lang, pageUrl: string): Record<string, unknown> | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    inLanguage: lang === "hr" ? "hr-HR" : "en-GB",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
