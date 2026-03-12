export default function StageScaffold({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/30 shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
      <header className="border-b border-slate-800 px-5 py-4">
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        {description ? <div className="mt-1 text-xs text-slate-400">{description}</div> : null}
      </header>

      <div className="px-5 py-5">
        {children || (
          <div className="text-sm text-slate-300">
            Placeholder screen. We will plug in the real UI and API logic later.
          </div>
        )}
      </div>
    </section>
  );
}
