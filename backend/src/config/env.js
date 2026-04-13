import dotenv from "dotenv";

dotenv.config();

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: num(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN || "",
  databaseUrl: process.env.DATABASE_URL,
  adzunaAppId: process.env.ADZUNA_APP_ID || "",
  adzunaAppKey: process.env.ADZUNA_APP_KEY || "",
  cronEnabled: process.env.CRON_ENABLED !== "false",
  cronSchedule: process.env.CRON_SCHEDULE || "0 */6 * * *",
  maxPagesPerRun: num(process.env.MAX_PAGES_PER_RUN, 40),
  resultsPerPage: Math.min(50, num(process.env.RESULTS_PER_PAGE, 50)),
};
