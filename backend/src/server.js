import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { startCron, stopCron } from "./cron.js";
import { prisma } from "./db/prisma.js";

if (!env.databaseUrl) {
  logger.error("missing_database_url");
  process.exit(1);
}

const app = createApp();
const server = app.listen(env.port, () => {
  logger.info("server_listening", { port: env.port, nodeEnv: env.nodeEnv });
  startCron();
});

async function gracefulShutdown(signal) {
  logger.info("shutdown_signal_received", { signal });

  stopCron();

  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info("server_shutdown_complete");
      process.exit(0);
    } catch (error) {
      logger.error("server_shutdown_failed", { message: error?.message });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("server_shutdown_timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
