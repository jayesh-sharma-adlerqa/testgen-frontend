import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http, getErrorMessage } from "../../../api/http";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";
import { fetchFeatureDocumentsRegistry } from "../../../projectFlow/featureDocsApi";

function IconFolder(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3.75 7.75A2.75 2.75 0 0 1 6.5 5h3.09c.67 0 1.31.27 1.79.75l.82.82c.23.23.54.36.87.36h4.43a2.75 2.75 0 0 1 2.75 2.75v6.82a2.75 2.75 0 0 1-2.75 2.75H6.5a2.75 2.75 0 0 1-2.75-2.75V7.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizeFeaturesResponse(responseData) {
  const candidates = [
    responseData?.data?.features,
    responseData?.features,
    responseData?.data?.items,
    responseData?.items,
    responseData?.data,
    responseData,
  ];
  const raw = candidates.find((x) => Array.isArray(x)) || [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const id = item.id ?? item.featureId ?? item._id ?? null;
      const name = item.name ?? item.featureName ?? "Untitled Feature";
      const description = item.description ?? "";

      if (!id) return null;

      return {
        id: String(id),
        name: String(name),
        description: description ? String(description) : "",
      };
    })
    .filter(Boolean);
}

function FeatureCard({ feature, isOpening, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(feature)}
      disabled={isOpening}
      className="group flex w-full flex-col items-start rounded-2xl border border-white/6 bg-white/[0.02] p-5 text-left transition hover:border-white/10 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
      title="Open feature"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] text-[#DAD28C] ring-1 ring-white/8">
        <IconFolder className="h-6 w-6" />
      </div>

      <div className="mt-4 w-full min-w-0">
        <div className="truncate text-sm font-semibold text-white">{feature.name}</div>
        <div className="mt-1 line-clamp-2 text-xs text-slate-400">
          {feature.description || " "}
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500 transition group-hover:text-slate-400">
        {isOpening ? "Opening..." : "Click to open"}
      </div>
    </button>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="mt-10 flex items-center justify-center">
      <button
        type="button"
        onClick={onCreate}
        className="w-full max-w-[760px] rounded-[26px] border border-dashed border-white/12 bg-white/[0.02] px-10 py-14 text-center transition hover:bg-white/[0.03]"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.03] text-slate-300">
          <IconPlus className="h-8 w-8" />
        </div>

        <div className="mt-7 text-2xl font-semibold text-white">Feature List</div>
        <div className="mt-2 text-sm text-slate-400">No Feature list yet</div>
      </button>
    </div>
  );
}

export default function FeatureListStage() {
  const navigate = useNavigate();

  const activeProject = useProjectSessionStore((s) => s.activeProject);
  const setActiveFeature = useProjectSessionStore((s) => s.setActiveFeature);
  const clearActiveVersion = useProjectSessionStore((s) => s.clearActiveVersion);

  const projectId = activeProject?.id || "";

  const [openingFeatureId, setOpeningFeatureId] = useState("");

  const featuresQuery = useQuery({
    queryKey: ["projects", projectId, "features"],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await http.get(`/projects/${projectId}/features`);
      return normalizeFeaturesResponse(res?.data);
    },
  });

  const features = useMemo(() => featuresQuery.data || [], [featuresQuery.data]);

  async function openFeature(feature) {
    if (!feature?.id || !projectId) return;

    setOpeningFeatureId(feature.id);

    try {
      setActiveFeature(feature);
      clearActiveVersion();

      const registry = await fetchFeatureDocumentsRegistry({
        projectId,
        featureId: feature.id,
      });

      const hasVersions = Array.isArray(registry?.versions) && registry.versions.length > 0;
      const hasDocuments = Array.isArray(registry?.items) && registry.items.length > 0;

      if (hasVersions || hasDocuments) {
        navigate("/projects?stage=versions-list");
      } else {
        navigate("/projects?stage=upload-documents");
      }
    } catch {
      navigate("/projects?stage=versions-list");
    } finally {
      setOpeningFeatureId("");
    }
  }

  if (!projectId) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">No project selected</div>
        <div className="mt-2 text-sm text-slate-400">
          Please go to Project List and open a project first.
        </div>
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

  if (featuresQuery.isLoading) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 rounded bg-white/5" />
          <div className="h-24 rounded-2xl bg-white/5" />
          <div className="h-24 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (featuresQuery.isError) {
    return (
      <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-base font-semibold text-rose-100">Failed to load features</div>
        <div className="mt-2 text-sm text-rose-200/90">{getErrorMessage(featuresQuery.error)}</div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => featuresQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
          >
            Retry
          </button>

          <button
            type="button"
            onClick={() => navigate("/projects?stage=create-feature")}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
          >
            <IconPlus className="h-4 w-4" />
            Add New Feature
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Project: <span className="text-slate-200">{activeProject?.name || "Project"}</span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/projects?stage=create-feature")}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
        >
          <IconPlus className="h-4 w-4" />
          Add New Feature
        </button>
      </div>

      {features.length === 0 ? (
        <EmptyState onCreate={() => navigate("/projects?stage=create-feature")} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <FeatureCard
              key={f.id}
              feature={f}
              isOpening={openingFeatureId === f.id}
              onOpen={openFeature}
            />
          ))}
        </div>
      )}
    </div>
  );
};