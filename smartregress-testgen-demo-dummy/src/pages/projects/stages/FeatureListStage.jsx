import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http, getErrorMessage } from "../../../api/http";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";
import { fetchFeatureDocumentsRegistry } from "../../../projectFlow/featureDocsApi";

function IconFolder(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M3.75 7.5A2.25 2.25 0 0 1 6 5.25h3.07c.38 0 .74.15 1.01.42l1 1c.27.27.63.42 1.01.42H18A2.25 2.25 0 0 1 20.25 9.3v7.2A2.25 2.25 0 0 1 18 18.75H6a2.25 2.25 0 0 1-2.25-2.25V7.5Z" />
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

function FeatureFolderTile({ feature, isOpening, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(feature)}
      disabled={isOpening}
      title={feature.description || feature.name}
      className="group flex w-[96px] flex-col items-start rounded-[12px] border border-white/[0.04] bg-white/[0.02] px-4 py-3 text-left transition duration-200 hover:border-white/[0.08] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <IconFolder className="h-10 w-10 text-[#D9D285] transition duration-200 group-hover:scale-[1.02]" />

      <div className="mt-3 w-full">
        <div className="truncate text-[11px] font-medium leading-4 text-slate-200">
          {feature.name}
        </div>
        {isOpening ? (
          <div className="mt-1 text-[10px] text-slate-500">Opening...</div>
        ) : null}
      </div>
    </button>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <button
        type="button"
        onClick={onCreate}
        className="flex w-full max-w-[520px] flex-col items-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-8 py-12 text-center transition hover:bg-white/[0.03]"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] text-slate-300">
          <IconPlus className="h-7 w-7" />
        </div>

        <div className="mt-6 text-lg font-semibold text-white">No features yet</div>
        <div className="mt-2 text-sm text-slate-400">
          Create your first feature to continue.
        </div>
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
      <div className="rounded-[18px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">No project selected</div>
        <div className="mt-2 text-sm text-slate-400">
          Please go to Project List and open a project first.
        </div>
        <button
          type="button"
          onClick={() => navigate("/projects?stage=project-list")}
          className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
        >
          Go to Project List
        </button>
      </div>
    );
  }

  if (featuresQuery.isLoading) {
    return (
      <div className="rounded-[18px] border border-white/8 bg-white/[0.02] p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,96px))] gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[92px] rounded-[12px] border border-white/[0.04] bg-white/[0.02]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (featuresQuery.isError) {
    return (
      <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-base font-semibold text-rose-100">
          Failed to load features
        </div>
        <div className="mt-2 text-sm text-rose-200/90">
          {getErrorMessage(featuresQuery.error)}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => featuresQuery.refetch()}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
          >
            Retry
          </button>

          <button
            type="button"
            onClick={() => navigate("/projects?stage=create-feature")}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
          >
            Add New Feature
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="relative min-h-[520px] w-full">
      {features.length === 0 ? (
        <EmptyState onCreate={() => navigate("/projects?stage=create-feature")} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,96px))] gap-x-8 gap-y-8">
          {features.map((feature) => (
            <FeatureFolderTile
              key={feature.id}
              feature={feature}
              isOpening={openingFeatureId === feature.id}
              onOpen={openFeature}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/projects?stage=create-feature")}
        className="fixed bottom-8 right-8 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/6 bg-[#1A2435] text-white shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition hover:bg-[#243147]"
        title="Add new feature"
        aria-label="Add new feature"
      >
        <IconPlus className="h-6 w-6" />
      </button>
    </section>
  );
};