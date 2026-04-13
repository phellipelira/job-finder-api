import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { corsOptions } from "./config/cors.js";
import { env } from "./config/env.js";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.use(routes);

  app.use((req, res) => {
    res.status(404).json({ ok: false, error: "Rota não encontrada" });
  });

  app.use(errorHandler);
  return app;
}
