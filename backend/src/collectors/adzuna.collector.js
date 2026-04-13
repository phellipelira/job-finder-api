import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { fetchWithRetry } from "../utils/httpClient.js";

const BASE = "https://api.adzuna.com/v1/api/jobs/br/search";

const DEFAULT_SEARCH_TERMS = [
  "desenvolvedor",
  "engenheiro software",
  "analista sistemas",
  "gerente tecnologia",
  "devops",
  "cientista dados",
  "product owner",
  "arquiteto software",
  "full stack",
  "backend",
  "frontend",
  "qa",
  "suporte ti",
];

function mapResult(r) {
  const title = r.title || "";
  const company = r.company?.display_name || r.company?.name || "";
  const location = [r.location?.display_name, r.location?.area?.[0]]
    .filter(Boolean)
    .join(", ");
  const description = r.description || "";
  const redirectUrl = r.redirect_url || r.url || "";
  return { title, company, location, description, redirectUrl };
}

export async function collectAdzunaJobs(options = {}) {
  const {
    maxPages = env.maxPagesPerRun,
    resultsPerPage = env.resultsPerPage,
    searchTerms = DEFAULT_SEARCH_TERMS,
  } = options;

  if (!env.adzunaAppId || !env.adzunaAppKey) {
    const err = new Error("ADZUNA_APP_ID e ADZUNA_APP_KEY são obrigatórios");
    err.code = "ADZUNA_CONFIG";
    throw err;
  }

  const collected = [];
  const seenUrls = new Set();
  let pagesFetched = 0;

  for (const what of searchTerms) {
    if (pagesFetched >= maxPages) break;
    let page = 1;
    while (pagesFetched < maxPages) {
      const url = `${BASE}/${page}`;
      const params = {
        app_id: env.adzunaAppId,
        app_key: env.adzunaAppKey,
        results_per_page: resultsPerPage,
        what: what,
      };

      logger.debug("adzuna_fetch", { page, what, pagesFetched });

      const res = await fetchWithRetry(url, { params });
      const data = res.data || {};
      const results = Array.isArray(data.results) ? data.results : [];

      if (results.length === 0) break;

      for (const item of results) {
        const job = mapResult(item);
        if (!job.redirectUrl) continue;
        if (seenUrls.has(job.redirectUrl)) continue;
        seenUrls.add(job.redirectUrl);
        collected.push(job);
      }

      pagesFetched += 1;
      page += 1;

      const total = Number(data.count || 0);
      const end = (page - 1) * resultsPerPage;
      if (total > 0 && end >= total) break;
    }
  }

  logger.info("adzuna_collect_done", {
    uniqueJobs: collected.length,
    pagesFetched,
  });

  return collected;
}
