import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getVersionOutputs } from "../../../api/demoBackend";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";

function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

function buildCsvRows(payload) {
  const rows = [["section", "value"]];

  payload.outputs.tests.ui.forEach((item) => rows.push(["UI Test Case", item]));
  payload.outputs.tests.api.forEach((item) => rows.push(["API Test Case", item]));
  payload.outputs.tests.regression.forEach((item) => rows.push(["Regression", item]));
  payload.outputs.tests.missingInfo.forEach((item) => rows.push(["Missing Info", item]));
  payload.outputs.validator.questions.forEach((item) => rows.push(["Validator Question", item]));
  payload.outputs.coverage.notes.forEach((item) => rows.push(["Coverage Note", item]));

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export default function ExportStage() {
  const navigate = useNavigate();
  const activeProject = useProjectSessionStore((s) => s.activeProject);
  const activeFeature = useProjectSessionStore((s) => s.activeFeature);
  const activeVersion = useProjectSessionStore((s) => s.activeVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";
  const versionNumber = activeVersion?.number;

  const outputs = useMemo(() => {
    if (!projectId || !featureId || !Number.isFinite(versionNumber)) return null;
    return getVersionOutputs({ projectId, featureId, versionNumber });
  }, [projectId, featureId, versionNumber]);

  const payload = useMemo(() => {
    if (!outputs) return null;
    return {
      project: activeProject,
      feature: activeFeature,
      version: activeVersion,
      outputs,
      exportedAt: new Date().toISOString(),
    };
  }, [activeProject, activeFeature, activeVersion, outputs]);

  if (!payload) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-lg font-semibold text-white">Nothing to export yet</div>
        <div className="mt-2 text-sm text-slate-400">Generate a version output first, then export becomes available.</div>
      </div>
    );
  }

  const jsonString = JSON.stringify(payload, null, 2);
  const csvString = buildCsvRows(payload);

  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
      <div className="text-lg font-semibold text-white">Export</div>
      <div className="mt-2 text-sm text-slate-400">
        Download the current demo output as JSON or CSV for client walkthroughs.
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => downloadBlob(`${activeFeature?.name || "feature"}-v${versionNumber}.json`, jsonString, "application/json")}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
        >
          Download JSON
        </button>
        <button
          type="button"
          onClick={() => downloadBlob(`${activeFeature?.name || "feature"}-v${versionNumber}.csv`, csvString, "text/csv")}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
        >
          Download CSV
        </button>
        <button
          type="button"
          onClick={() => navigate("/projects?stage=feature-list")}
          className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
        >
          Back to Feature List
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-white/8 bg-slate-950/60 p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</div>
        <pre className="max-h-[420px] overflow-auto text-xs text-slate-300">{jsonString}</pre>
      </div>
    </div>
  );
}
