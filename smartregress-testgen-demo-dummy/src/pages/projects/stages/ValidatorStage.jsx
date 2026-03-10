import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "../../../api/http";
import { getVersionOutputs } from "../../../api/demoBackend";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";
import { fetchFeatureDocumentsByVersion } from "../../../projectFlow/featureDocsApi";

function IconBack(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlaceholderCard({ title, subtitle }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
      <div className="text-lg font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm text-slate-400">{subtitle}</div>
    </div>
  );
}

export default function ValidatorStage() {
  const navigate = useNavigate();

  const activeProject = useProjectSessionStore((state) => state.activeProject);
  const activeFeature = useProjectSessionStore((state) => state.activeFeature);
  const activeVersion = useProjectSessionStore((state) => state.activeVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";
  const versionNumber = activeVersion?.number;

  const docsQuery = useQuery({
    queryKey: ["projects", projectId, "features", featureId, "documents-by-version", versionNumber],
    enabled: Boolean(projectId && featureId && Number.isFinite(versionNumber)),
    queryFn: async () =>
      fetchFeatureDocumentsByVersion({
        projectId,
        featureId,
        versionNumber,
      }),
    staleTime: 5_000,
  });

  const validator = useMemo(() => {
    if (!projectId || !featureId || !Number.isFinite(versionNumber)) return null;
    return getVersionOutputs({ projectId, featureId, versionNumber })?.validator || null;
  }, [projectId, featureId, versionNumber]);

  if (!projectId || !featureId) {
    return <PlaceholderCard title="Validator" subtitle="Select a project and feature first." />;
  }

  if (!Number.isFinite(versionNumber)) {
    return <PlaceholderCard title="Validator" subtitle="Open a version from Feature Workspace first." />;
  }

  if (docsQuery.isLoading) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-white/5" />
          <div className="h-[240px] rounded-[18px] bg-white/5" />
        </div>
      </div>
    );
  }

  if (docsQuery.isError) {
    return (
      <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-base font-semibold text-rose-100">Failed to load validator context</div>
        <div className="mt-2 text-sm text-rose-200/90">{getErrorMessage(docsQuery.error)}</div>
      </div>
    );
  }

  if (!validator) {
    return (
      <PlaceholderCard
        title="Validator"
        subtitle="Validator output is not available for this version yet."
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-[#8BB5FF]">
        <button
          type="button"
          onClick={() => navigate("/projects?stage=feature-workspace")}
          className="inline-flex items-center justify-center rounded p-1 transition hover:bg-white/5"
          title="Back"
        >
          <IconBack className="h-4 w-4" />
        </button>
        <span className="text-[15px] font-medium">Validator</span>
      </div>

      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white">Validator Summary</div>
            <div className="mt-1 text-sm text-slate-400">
              {activeProject?.name} / {activeFeature?.name} / v{versionNumber}
            </div>
          </div>

          <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">
            Score: {validator.score ?? "—"}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-[18px] border border-white/8 bg-slate-950/40 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Questions</div>
            <div className="mt-4 space-y-3">
              {(validator.questions || []).map((question, index) => (
                <div
                  key={`${index}-${question}`}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                >
                  <span className="mr-2 text-slate-500">{index + 1}.</span>
                  {question}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[18px] border border-white/8 bg-slate-950/40 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Feedback</div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                {validator.feedback || "No validator feedback available."}
              </p>
            </div>

            <div className="rounded-[18px] border border-white/8 bg-slate-950/40 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Weak areas</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(validator.weakAreas || []).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/projects?stage=feature-workspace")}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
            >
              Back to Feature Workspace
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};