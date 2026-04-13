import {
  detectBrazilLocation,
  detectRemote,
  isRelevantCompany,
  isStrategicRole,
  normalizeText,
} from "./text.js";
import { suggestDomainFromCompany, suggestEmail } from "./domain.js";

export function buildLeadFields({ title, company, location, description }) {
  const cleanTitle = normalizeText(title);
  const cleanCompany = normalizeText(company);
  const cleanLocation = normalizeText(location);
  const cleanDescription = normalizeText(description);

  const companyDomain = suggestDomainFromCompany(cleanCompany);
  const suggestedEmail = suggestEmail(companyDomain);
  const isRemote = detectRemote(cleanTitle, cleanDescription);
  const isBrazil = detectBrazilLocation(cleanLocation);

  const hasDomain = Boolean(companyDomain);
  const hasEmail = Boolean(suggestedEmail);

  let score = 0;
  if (hasDomain) score += 30;
  if (hasEmail) score += 20;
  if (isRemote) score += 15;
  if (isStrategicRole(cleanTitle)) score += 20;
  if (isRelevantCompany(cleanCompany)) score += 10;
  if (isBrazil) score += 5;

  return {
    title: cleanTitle,
    company: cleanCompany,
    location: cleanLocation,
    description: cleanDescription,
    companyDomain,
    suggestedEmail,
    score: Math.min(100, score),
    isRemote,
  };
}
