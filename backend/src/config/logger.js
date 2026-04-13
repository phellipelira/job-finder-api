import { env } from "./env.js";

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const current = env.nodeEnv === "production" ? levels.info : levels.debug;

function ts() {
  return new Date().toISOString();
}

function out(level, msg, meta) {
  const line = { ts: ts(), level, msg, ...meta };
  const text = JSON.stringify(line);
  if (level === "error") console.error(text);
  else console.log(text);
}

export const logger = {
  error(msg, meta = {}) {
    if (current >= levels.error) out("error", msg, meta);
  },
  warn(msg, meta = {}) {
    if (current >= levels.warn) out("warn", msg, meta);
  },
  info(msg, meta = {}) {
    if (current >= levels.info) out("info", msg, meta);
  },
  debug(msg, meta = {}) {
    if (current >= levels.debug) out("debug", msg, meta);
  },
};
