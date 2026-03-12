import { getDashboardSummary } from "../api/demoBackend";

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-slate-400">{helper}</div>
    </div>
  );
}

export default function Dashboard() {
  const summary = getDashboardSummary();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="rounded-[28px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-2xl font-semibold text-white">TestGen Demo Dashboard</div>
        <div className="mt-2 text-sm text-slate-400">
          This build runs entirely on dummy data so you can walk the client through the full flow without any backend dependency.
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Projects" value={summary.projectCount} helper="Demo workspaces available" />
          <StatCard label="Features" value={summary.featureCount} helper="Feature scopes across projects" />
          <StatCard label="Versions" value={summary.versionCount} helper="Reusable artifact histories" />
          <StatCard label="Ready" value={summary.readyCount} helper="Versions ready for generation" />
          <StatCard label="Generated" value={summary.generatedCount} helper="Outputs already available" />
        </div>

        <div className="mt-6 rounded-2xl border border-white/8 bg-slate-950/60 p-5">
          <div className="text-sm font-semibold text-white">Recent version activity</div>
          <div className="mt-4 space-y-3">
            {summary.recentVersions.map((item, index) => (
              <div key={`${item.featureName}-${item.versionNumber}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-white">{item.featureName}</div>
                  <div className="mt-1 text-xs text-slate-400">Version v{item.versionNumber}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1">{item.indexingStatus}</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
