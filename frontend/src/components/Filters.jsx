export function Filters({ q, onQChange, minScore, onMinScoreChange, onApply }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 md:flex-row md:items-end">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-400">Busca</label>
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Empresa, cargo ou local…"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div className="w-full md:w-40">
        <label className="mb-1 block text-xs font-medium text-slate-400">Score mín.</label>
        <input
          type="number"
          min={0}
          max={100}
          value={minScore}
          onChange={(e) => onMinScoreChange(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <button
        type="button"
        onClick={onApply}
        className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Aplicar filtros
      </button>
    </div>
  );
}
