function scoreBadgeClass(score) {
  if (score >= 80) return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
  if (score >= 60) return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30";
  return "bg-slate-700/50 text-slate-200 ring-1 ring-slate-600";
}

export function LeadsTable({ rows, loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
        Carregando leads…
      </div>
    );
  }

  if (!rows?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/20 p-8 text-center text-slate-500">
        Nenhum lead encontrado com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead className="bg-slate-950/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">Localização</th>
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">E-mail sugerido</th>
              <th className="px-4 py-3 font-medium">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((job) => (
              <tr key={job.id} className="hover:bg-slate-800/40">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-white">{job.company}</td>
                <td className="max-w-xs px-4 py-3 text-slate-300">{job.title}</td>
                <td className="px-4 py-3 text-slate-400">{job.location || "—"}</td>
                <td className="px-4 py-3">
                  {job.companyDomain ? (
                    <a
                      href={`https://${job.companyDomain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-400 hover:underline"
                    >
                      {job.companyDomain}
                    </a>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {job.suggestedEmail || <span className="text-slate-600">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBadgeClass(job.score)}`}
                  >
                    {job.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
