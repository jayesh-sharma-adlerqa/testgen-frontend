import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";
import { getStageFromSearch } from "../../../projectFlow/flowConfig";
import { getVersionOutputs, regenerateVersionOutputs } from "../../../api/demoBackend";

function Panel({ title, children, action }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        {action || null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function LineList({ items }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
          {item}
        </div>
      ))}
    </div>
  );
}

function SummaryBadge({ children }) {
  return <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-slate-200">{children}</span>;
}

export default function GenerateStage() {
  const location = useLocation();
  const navigate = useNavigate();
  const stage = getStageFromSearch(location.search);

  const activeProject = useProjectSessionStore((s) => s.activeProject);
  const activeFeature = useProjectSessionStore((s) => s.activeFeature);
  const activeVersion = useProjectSessionStore((s) => s.activeVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";
  const versionNumber = activeVersion?.number;

  const [refreshSeed, setRefreshSeed] = useState(0);

  const outputs = useMemo(() => {
    if (!projectId || !featureId || !Number.isFinite(versionNumber)) return null;
    return getVersionOutputs({ projectId, featureId, versionNumber });
  }, [projectId, featureId, versionNumber, refreshSeed]);

  if (!projectId || !featureId || !Number.isFinite(versionNumber)) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">Missing context</div>
        <div className="mt-2 text-sm text-slate-400">Please select a project, feature and version first.</div>
        <button
          type="button"
          onClick={() => navigate("/projects?stage=project-list")}
          className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
        >
          Go to Project List
        </button>
      </div>
    );
  }

  if (!outputs) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">No demo output found</div>
        <div className="mt-2 text-sm text-slate-400">Create a version first to unlock generated demo data.</div>
      </div>
    );
  }

  const titleMap = {
    generate: "Generated Tests",
    validator: "Validator Output",
    coverage: "Coverage Summary",
  };

  const subtitle = `${activeProject?.name || "Project"} / ${activeFeature?.name || "Feature"} / v${versionNumber}`;

  const handleRegenerate = () => {
    regenerateVersionOutputs({ projectId, featureId, versionNumber });
    setRefreshSeed((value) => value + 1);
  };

  return (
    <section className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-white">{titleMap[stage] || "Generate"}</div>
          <div className="mt-1 text-sm text-slate-400">{subtitle}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <SummaryBadge>Demo mode</SummaryBadge>
            <SummaryBadge>Editable output</SummaryBadge>
            <SummaryBadge>Version aware</SummaryBadge>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRegenerate}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
        >
          Regenerate Demo Output
        </button>
      </div>

      {stage === "validator" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Assessment Questions">
            <LineList items={outputs.validator.questions} />
          </Panel>

          <Panel title="Score & Feedback">
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-4">
              <div className="text-3xl font-semibold text-white">{outputs.validator.score}%</div>
              <div className="mt-2 text-sm text-slate-200">{outputs.validator.feedback}</div>
            </div>
            <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Weak areas</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {outputs.validator.weakAreas.map((item) => (
                <SummaryBadge key={item}>{item}</SummaryBadge>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}

      {stage === "coverage" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Panel title="Overall Coverage">
            <div className="rounded-2xl border border-sky-400/15 bg-sky-500/10 p-4">
              <div className="text-3xl font-semibold text-white">{outputs.coverage.overall}%</div>
              <div className="mt-2 text-sm text-slate-200">Demo summary based on the uploaded feature artifacts and generation context.</div>
            </div>
          </Panel>

          <Panel title="Coverage Notes">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Weak areas</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {outputs.coverage.weakAreas.map((item) => (
                <SummaryBadge key={item}>{item}</SummaryBadge>
              ))}
            </div>
            <div className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Notes</div>
            <div className="mt-2">
              <LineList items={outputs.coverage.notes} />
            </div>
          </Panel>
        </div>
      ) : null}

      {stage === "generate" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel title="UI Test Cases">
            <LineList items={outputs.tests.ui} />
          </Panel>
          <Panel title="API Test Cases">
            <LineList items={outputs.tests.api} />
          </Panel>
          <Panel title="Regression Checklist">
            <LineList items={outputs.tests.regression} />
          </Panel>
          <Panel title="Missing Info">
            <LineList items={outputs.tests.missingInfo} />
          </Panel>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate("/projects?stage=edit")}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
        >
          Open Editor
        </button>
        <button
          type="button"
          onClick={() => navigate("/projects?stage=export")}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
        >
          Go to Export
        </button>
      </div>
    </section>
  );
}
