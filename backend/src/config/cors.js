import { env } from "./env.js";
import { logger } from "./logger.js";

function parseOriginList(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Em produção: só origens listadas em CORS_ORIGIN (separadas por vírgula).
 * Em desenvolvimento: se CORS_ORIGIN estiver vazio, permite localhost/127.0.0.1 (qualquer porta).
 */
export function corsOriginCallback(origin, callback) {
  const allowed = parseOriginList(env.corsOrigin);

  if (!origin) {
    callback(null, true);
    return;
  }

  if (env.nodeEnv === "production") {
    if (allowed.length === 0) {
      logger.warn("cors_production_no_whitelist", {
        hint: "Defina CORS_ORIGIN com as origens do frontend (ex.: https://app.exemplo.com)",
      });
      callback(null, false);
      return;
    }
    callback(null, allowed.includes(origin));
    return;
  }

  if (allowed.length > 0) {
    callback(null, allowed.includes(origin));
    return;
  }

  const localhostOk =
    /^https?:\/\/localhost(?::\d+)?$/i.test(origin) ||
    /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin);
  callback(null, localhostOk);
}

export const corsOptions = {
  origin: corsOriginCallback,
  credentials: true,
};
