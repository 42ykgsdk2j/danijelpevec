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
 * URL builder. EN URLs are at root (`/blog`, `/assessment`); HR URLs live under
 * `/hr/` (`/hr/blog`, `/hr/assessment`). The home page is `/` for EN and `/hr/`
 * for HR.
 */
export function url(lang: Lang, path = ""): string {
  const clean = path.replace(/^\/+/, "");
  if (lang === "hr") {
    return clean ? `/hr/${clean}` : "/hr/";
  }
  return clean ? `/${clean}` : "/";
}

/**
 * Build the absolute URL for the same page in the other language. Used for the
 * EN/HR language toggle in the nav and hreflang link tags.
 */
export function counterpartUrl(currentLang: Lang, currentPath: string): string {
  // Normalise currentPath: ensure it starts with /
  let p = currentPath.startsWith("/") ? currentPath : "/" + currentPath;
  // Strip the .html extension for compare logic but preserve it on output
  if (currentLang === "hr") {
    // /hr/foo → /foo  (or "/hr/" → "/")
    if (p === "/hr/" || p === "/hr") return "/";
    return p.replace(/^\/hr\//, "/");
  } else {
    // /foo → /hr/foo  (or "/" → "/hr/")
    if (p === "/" || p === "") return "/hr/";
    return "/hr" + p;
  }
}
