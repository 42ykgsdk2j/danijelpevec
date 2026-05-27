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
 * URL builder. HR is the default locale and lives at root (`/blog`,
 * `/assessment`); EN URLs live under `/en/` (`/en/blog`, `/en/assessment`).
 * The home page is `/` for HR and `/en/` for EN.
 */
export function url(lang: Lang, path = ""): string {
  const clean = path.replace(/^\/+/, "");
  if (lang === "en") {
    return clean ? `/en/${clean}` : "/en/";
  }
  return clean ? `/${clean}` : "/";
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
