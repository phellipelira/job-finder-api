import axios from "axios";
import { logger } from "../config/logger.js";

const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 800;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(err) {
  const code = err?.code;
  const status = err?.response?.status;
  if (code === "ECONNABORTED" || code === "ETIMEDOUT" || code === "ECONNRESET") return true;
  if (!status) return true;
  return status >= 500 || status === 429;
}

export async function fetchWithRetry(url, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    retries = MAX_RETRIES,
    headers = {},
    params,
    ...rest
  } = options;

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await axios.get(url, {
        timeout,
        headers,
        params,
        validateStatus: (s) => s >= 200 && s < 300,
        ...rest,
      });
      return res;
    } catch (err) {
      lastErr = err;
      const retry = isRetryable(err) && attempt < retries;
      logger.warn("http_retry", {
        url,
        attempt,
        retries,
        message: err?.message,
        status: err?.response?.status,
        willRetry: retry,
      });
      if (!retry) break;
      const jitter = Math.floor(Math.random() * 400);
      await sleep(BASE_DELAY_MS * attempt + jitter);
    }
  }
  throw lastErr;
}
