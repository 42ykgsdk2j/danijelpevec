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
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}/#website`,
    name: BUSINESS.personName,
    url: `${SITE}/`,
    inLanguage: lang === "hr" ? "hr-HR" : "en-GB",
    publisher: { "@id": PERSON_ID },
  };
}
