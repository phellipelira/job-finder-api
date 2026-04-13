import { useMemo, useState } from "react";
import { Navbar } from "../components/Navbar.jsx";
import { MetricCard } from "../components/MetricCard.jsx";
import { Filters } from "../components/Filters.jsx";
import { LeadsTable } from "../components/LeadsTable.jsx";
import { ScoreChart } from "../components/ScoreChart.jsx";
import { useDashboard } from "../hooks/useDashboard.js";
import { useJobs } from "../hooks/useJobs.js";
import { postUpdateJobs } from "../services/api.js";

export default function Dashboard() {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [minInput, setMinInput] = useState("");
  const [minScore, setMinScore] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState(null);

  const { data: dash, loading: dashLoading, error: dashError, reload: reloadDash } =
    useDashboard();
  const { data: jobsRes, loading: jobsLoading, error: jobsError, reload: reloadJobs } =
    useJobs({ page, limit, q, minScore });

  const metrics = dash?.metrics;

  const chartData = useMemo(
    () => dash?.charts?.scoreDistribution || [],
    [dash],
  );

  async function handleRefreshLeads() {
    setUpdating(true);
    setUpdateMsg(null);
    try {
      const res = await postUpdateJobs();
      setUpdateMsg(res?.message || "Concluído");
      await Promise.all([reloadDash(), reloadJobs()]);
    } catch (e) {
      setUpdateMsg(e?.response?.data?.error || e?.message || "Erro ao atualizar");
    } finally {
      setUpdating(false);
    }
  }

  function applyFilters() {
    setQ(qInput);
    setMinScore(minInput === "" ? "" : Number(minInput));
    setPage(1);
  }

  const totalPages = jobsRes?.pagination?.totalPages || 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <Navbar onRefresh={handleRefreshLeads} updating={updating} />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        {updateMsg ? (
          <div className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
            {updateMsg}
          </div>
        ) : null}

        {dashError ? (
          <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {dashError}
          </div>
        ) : null}

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Métricas
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total de leads"
              value={dashLoading ? "…" : (metrics?.totalLeads ?? 0)}
            />
            <MetricCard
              label="Leads quentes (score ≥ 70)"
              value={dashLoading ? "…" : (metrics?.hotLeads ?? 0)}
              hint="Prioridade para contato"
            />
            <MetricCard
              label="Com domínio sugerido"
              value={dashLoading ? "…" : (metrics?.withDomain ?? 0)}
            />
            <MetricCard
              label="Com e-mail sugerido"
              value={dashLoading ? "…" : (metrics?.withSuggestedEmail ?? 0)}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ScoreChart data={chartData} />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <p className="text-sm font-medium text-slate-300">Como usar</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">
              <li>Filtre por texto ou score mínimo.</li>
              <li>Use &quot;Atualizar Leads&quot; para sincronizar com a Adzuna (Brasil).</li>
              <li>Domínio e e-mail são sugeridos a partir do nome da empresa.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Leads
          </h2>
          <Filters
            q={qInput}
            onQChange={setQInput}
            minScore={minInput}
            onMinScoreChange={setMinInput}
            onApply={applyFilters}
          />

          {jobsError ? (
            <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {jobsError}
            </div>
          ) : null}

          <LeadsTable rows={jobsRes?.data} loading={jobsLoading} />

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
            <span>
              Página {jobsRes?.pagination?.page || page} de {totalPages} —{" "}
              {jobsRes?.pagination?.total ?? 0} registros
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || jobsLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= totalPages || jobsLoading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
