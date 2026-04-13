import { buildLeadFields } from "../utils/score.js";

export function processJobPayload({ title, company, location, description, redirectUrl }) {
  const fields = buildLeadFields({ title, company, location, description });
  return {
    ...fields,
    redirectUrl,
  };
}
