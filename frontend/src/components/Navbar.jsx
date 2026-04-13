export function Navbar({ onRefresh, updating }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-brand-500">
            Job Leads SaaS
          </p>
          <h1 className="text-lg font-semibold text-white">Painel de prospecção</h1>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={updating}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updating ? "Atualizando…" : "Atualizar Leads"}
        </button>
      </div>
    </header>
  );
}
