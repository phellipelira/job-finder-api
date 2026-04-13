import cron from "node-cron";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { syncJobsFromAdzuna } from "./services/jobSync.service.js";

let task = null;

export function startCron() {
  if (!env.cronEnabled) {
    logger.info("cron_disabled");
    return;
  }

  if (!env.adzunaAppId || !env.adzunaAppKey) {
    logger.warn("cron_skipped_missing_adzuna");
    return;
  }

  const schedule = env.cronSchedule;
  if (!cron.validate(schedule)) {
    logger.error("cron_invalid_schedule", { schedule });
    return;
  }

  task = cron.schedule(
    schedule,
    async () => {
      try {
        logger.info("cron_sync_started");
        await syncJobsFromAdzuna();
        logger.info("cron_sync_finished");
      } catch (e) {
        logger.error("cron_sync_failed", { message: e?.message });
      }
    },
    { timezone: "America/Sao_Paulo" },
  );

  logger.info("cron_started", { schedule });
}

export function stopCron() {
  if (task) {
    task.stop();
    task = null;
  }
}
