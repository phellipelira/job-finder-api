import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  adzunaAppId: process.env.ADZUNA_APP_ID,
  adzunaAppKey: process.env.ADZUNA_APP_KEY,
  cronEnabled: process.env.CRON_ENABLED === "true",
  cronSchedule: process.env.CRON_SCHEDULE || "0 */6 * * *",
};