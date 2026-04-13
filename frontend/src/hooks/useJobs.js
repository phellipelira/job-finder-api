import { useCallback, useEffect, useState } from "react";
import { fetchJobs } from "../services/api.js";

function normalizeMinScore(minScore) {
  if (minScore === "" || minScore == null) return undefined;
  const n = Number(minScore);
  return Number.isFinite(n) ? n : undefined;
}

export function useJobs({ page, limit, q, minScore }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJobs({
        page,
        limit,
        q: q || undefined,
        minScore: normalizeMinScore(minScore),
      });
      setData(res);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Falha ao carregar vagas");
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, minScore]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
