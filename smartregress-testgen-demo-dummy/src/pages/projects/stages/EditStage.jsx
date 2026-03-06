import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVersionOutputs, updateVersionOutputs } from "../../../api/demoBackend";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";

function FieldBlock({ title, value, onChange, helper }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="text-sm font-semibold text-white">{title}</div>
      {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        className="mt-4 w-full rounded-xl border border-white/8 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400/40"
      />
    </div>
  );
}

function splitLines(text) {
  return String(text || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EditStage() {
  const navigate = useNavigate();
  const activeProject = useProjectSessionStore((s) => s.activeProject);
  const activeFeature = useProjectSessionStore((s) => s.activeFeature);
  const activeVersion = useProjectSessionStore((s) => s.activeVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";
  const versionNumber = activeVersion?.number;

  const baseOutputs = useMemo(() => {
    if (!projectId || !featureId || !Number.isFinite(versionNumber)) return null;
    return getVersionOutputs({ projectId, featureId, versionNumber });
  }, [projectId, featureId, versionNumber]);

  const [uiTests, setUiTests] = useState("");
  const [apiTests, setApiTests] = useState("");
  const [regression, setRegression] = useState("");
  const [missingInfo, setMissingInfo] = useState("");
  const [validatorQuestions, setValidatorQuestions] = useState("");
  const [coverageNotes, setCoverageNotes] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!baseOutputs) return;
    setUiTests((baseOutputs.tests?.ui || []).join("\n"));
    setApiTests((baseOutputs.tests?.api || []).join("\n"));
    setRegression((baseOutputs.tests?.regression || []).join("\n"));
    setMissingInfo((baseOutputs.tests?.missingInfo || []).join("\n"));
    setValidatorQuestions((baseOutputs.validator?.questions || []).join("\n"));
    setCoverageNotes((baseOutputs.coverage?.notes || []).join("\n"));
    setSaved(false);
  }, [baseOutputs]);

  if (!projectId || !featureId || !Number.isFinite(versionNumber) || !baseOutputs) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-lg font-semibold text-white">Nothing to edit yet</div>
        <div className="mt-2 text-sm text-slate-400">Generate or open a version first, then the demo editor will become available.</div>
      </div>
    );
  }

  function handleSave() {
    updateVersionOutputs({
      projectId,
      featureId,
      versionNumber,
      outputs: {
        ...baseOutputs,
        tests: {
          ...baseOutputs.tests,
          ui: splitLines(uiTests),
          api: splitLines(apiTests),
          regression: splitLines(regression),
          missingInfo: splitLines(missingInfo),
          lastGeneratedAt: new Date().toISOString(),
        },
        validator: {
          ...baseOutputs.validator,
          questions: splitLines(validatorQuestions),
          lastGeneratedAt: new Date().toISOString(),
        },
        coverage: {
          ...baseOutputs.coverage,
          notes: splitLines(coverageNotes),
          lastGeneratedAt: new Date().toISOString(),
        },
      },
    });

    setSaved(true);
  }

  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-white">Edit Output</div>
          <div className="mt-1 text-sm text-slate-400">
            {activeProject?.name} / {activeFeature?.name} / v{versionNumber}
          </div>
        </div>

        {saved ? <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">Saved locally</div> : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <FieldBlock title="UI Test Cases" value={uiTests} onChange={setUiTests} helper="One test per line" />
        <FieldBlock title="API Test Cases" value={apiTests} onChange={setApiTests} helper="One test per line" />
        <FieldBlock title="Regression Checklist" value={regression} onChange={setRegression} helper="One item per line" />
        <FieldBlock title="Missing Info" value={missingInfo} onChange={setMissingInfo} helper="One item per line" />
        <FieldBlock title="Validator Questions" value={validatorQuestions} onChange={setValidatorQuestions} helper="One question per line" />
        <FieldBlock title="Coverage Notes" value={coverageNotes} onChange={setCoverageNotes} helper="One note per line" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={() => navigate("/projects?stage=export")}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
        >
          Continue to Export
        </button>
        <button
          type="button"
          onClick={() => navigate("/projects?stage=version-detail")}
          className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
        >
          Back to Feature Details
        </button>
      </div>
    </div>
  );
}
