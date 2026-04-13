import { normalizeText } from "./text.js";

const LEGAL_SUFFIX = /\b(ltda|ltda\.|s\.a\.|sa\b|s\/a|me\b|eireli|epp)\b/gi;

function slugifyCompany(name) {
  let s = normalizeText(name).toLowerCase();
  s = s.replace(LEGAL_SUFFIX, " ");
  s = s.replace(/[^a-z0-9]+/g, "");
  return s.slice(0, 63);
}

export function suggestDomainFromCompany(companyName) {
  const slug = slugifyCompany(companyName);
  if (!slug || slug.length < 2) return null;
  return `${slug}.com.br`;
}

export function suggestEmail(domain) {
  if (!domain) return null;
  return `contato@${domain}`;
}
