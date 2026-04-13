import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { startCron } from "./cron.js";

if (!env.databaseUrl) {
  logger.error("missing_database_url");
  process.exit(1);
}

const app = createApp();

app.listen(env.port, () => {
  logger.info("server_listening", { port: env.port, nodeEnv: env.nodeEnv });
  startCron();
});
