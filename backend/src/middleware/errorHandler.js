import { logger } from "../config/logger.js";

export function errorHandler(err, req, res, next) {
  logger.error("request_error", {
    message: err?.message,
    stack: err?.stack,
    path: req.path,
    code: err?.code,
  });

  const status = err.status || err.statusCode || 500;
  const body = {
    ok: false,
    error: status === 500 ? "Erro interno do servidor" : err.message || "Erro",
  };
  if (process.env.NODE_ENV === "development" && err?.message) {
    body.detail = err.message;
  }
  res.status(status).json(body);
}
