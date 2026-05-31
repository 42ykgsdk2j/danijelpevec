/**
 * Tiny i18n helper.
 *
 * `getT(lang)` returns the translation tree for the page. Astro pages call this
 * once at the top of their frontmatter:
 *
 *     const t = getT(lang);
 *
 * `urlFor` produces the right URL prefix for cross-language navigation. EN uses
 * clean URLs (no prefix), HR lives under /hr/.
 */

import en from "../data/en.json";
import hr from "../data/hr.json";

export type Lang = "en" | "hr";

const translations = { en, hr } as const;
export type Translations = (typeof translations)["en"];

export function getT(lang: Lang): Translations {
  return translations[lang] as Translations;
}

/** Site origin — used to build canonical / OG / hreflang URLs. */
export const SITE = "https://www.danijelpevec.com";

/**
 * Single source of truth for the site-wide identity used in structured data
 * (JSON-LD on the homepages) and anywhere else we need to spell out who the
 * site is, where the practice is, or how to reach it. Keep this in sync with
 * the Google Business Profile listing — Google cross-checks the two.
 */
export const BUSINESS = {
  personName: "Danijel Pevec",
  practiceName: "Family Business by Danijel Pevec",
  jobTitle: {
    hr: "Savjetnik za obiteljski biznis",
    en: "Family Business Advisor",
  },
  description: {
    hr: "Pomažem osnivačima i njihovim obiteljima izgraditi nasljeđe kroz odluke koje oblikuju rast, sukcesiju i tranziciju među generacijama.",
    en: "I help founders and their families build a legacy through the decisions that shape growth, succession and generational transition.",
  },
  email: "pevec.danijel@alphacapitalis.com",
  telephone: "+385992401771",
  address: {
    streetAddress: "Ulica Roberta Frangeša - Mihanovića 9",
    postalCode: "10110",
    addressLocality: "Zagreb",
    addressCountry: "HR",
  },
  sameAs: [
    // NB: removed the Google Business Profile share-link
    // ("https://share.google/cay1syxahxDwS4s6D") because it now
    // redirects to a Google search results page (expired share
    // shortcode). Re-add with a permanent profile URL when available.
    "https://www.linkedin.com/in/danijelpevec",
    "https://www.alphacapitalis.com/",
  ],
} as const;

/**
 * URL builder. HR is the default locale and lives at root (`/blog`,
 * `/assessment`); EN URLs live under `/en/` (`/en/blog`, `/en/assessment`).
 * The home page is `/` for HR and `/en/` for EN.
 */
export function url(lang: Lang, path = ""): string {
  const clean = path.replace(/^\/+/, "").replace(/\/+$/, "");
  if (lang === "en") {
    return clean ? `/en/${clean}/` : "/en/";
  }
  return clean ? `/${clean}/` : "/";
}

/**
 * Build the absolute URL for the same page in the other language. Used for the
 * EN/HR language toggle in the nav and hreflang link tags.
 */
export function counterpartUrl(currentLang: Lang, currentPath: string): string {
  // Normalise currentPath: ensure it starts with /
  const p = currentPath.startsWith("/") ? currentPath : "/" + currentPath;
  if (currentLang === "en") {
    // /en/foo → /foo  (or "/en/" → "/")
    if (p === "/en/" || p === "/en") return "/";
    return p.replace(/^\/en\//, "/");
  } else {
    // /foo → /en/foo  (or "/" → "/en/")
    if (p === "/" || p === "") return "/en/";
    return "/en" + p;
  }
}
