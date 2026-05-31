import { BUSINESS, SITE, type Lang } from "./i18n";

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
  return {
    "@context": "https://schema.org",
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
