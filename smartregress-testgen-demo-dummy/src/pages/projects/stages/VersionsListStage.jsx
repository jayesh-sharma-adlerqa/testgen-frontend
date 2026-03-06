import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "../../../api/http";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";
import { fetchFeatureDocumentsRegistry, deriveVersionsFromRegistry } from "../../../projectFlow/featureDocsApi";

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

function IconChevronRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function groupByVersion(registry) {
  const safeRegistry = Array.isArray(registry?.items) ? registry : { items: Array.isArray(registry) ? registry : [] };
  const items = safeRegistry.items;
  const derived = deriveVersionsFromRegistry(safeRegistry);
  const map = new Map();

  for (const it of items) {
    const v = it?.versionNumber;
    if (!Number.isFinite(v)) continue;

    const key = String(v);
    if (!map.has(key)) {
      map.set(key, {
        versionNumber: v,
        docTypes: new Set(),
        items: [],
        createdAt: it?.createdAt || null,
        indexingStatus: it?.indexingStatus || null,
      });
    }

    const bucket = map.get(key);
    if (it?.docType) bucket.docTypes.add(it.docType);
    bucket.items.push(it);

    if (it?.createdAt) bucket.createdAt = it.createdAt;
    if (it?.indexingStatus) bucket.indexingStatus = it.indexingStatus;
  }

  for (const versionNumber of derived.versions) {
    const key = String(versionNumber);
    if (!map.has(key)) {
      map.set(key, {
        versionNumber,
        docTypes: new Set(),
        items: [],
        createdAt: null,
        indexingStatus: null,
      });
    }
  }

  const rows = Array.from(map.values());
  rows.sort((a, b) => b.versionNumber - a.versionNumber);

  return rows.map((row) => ({
    ...row,
    docTypes: Array.from(row.docTypes),
  }));
}

export default function VersionsListStage() {
  const navigate = useNavigate();

  const activeProject = useProjectSessionStore((s) => s.activeProject);
  const activeFeature = useProjectSessionStore((s) => s.activeFeature);
  const setActiveVersion = useProjectSessionStore((s) => s.setActiveVersion);
  const clearActiveVersion = useProjectSessionStore((s) => s.clearActiveVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";

  const registryQuery = useQuery({
    queryKey: ["projects", projectId, "features", featureId, "docs-registry"],
    enabled: Boolean(projectId && featureId),
    queryFn: async () => {
      return fetchFeatureDocumentsRegistry({ projectId, featureId });
    },
  });

  const versionsMeta = useMemo(() => {
    const registry = registryQuery.data || { items: [], versions: [], latest: null };
    const derived = deriveVersionsFromRegistry(registry);
    const grouped = groupByVersion(registry);
    return { ...derived, grouped };
  }, [registryQuery.data]);

  function goUploadNewVersion() {
    clearActiveVersion();
    navigate("/projects?stage=upload-documents");
  }

  function openVersion(v) {
    setActiveVersion(v);
    navigate("/projects?stage=version-detail");
  }

  if (!projectId || !featureId) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">No feature selected</div>
        <div className="mt-2 text-sm text-slate-400">Please select a feature first.</div>
        <button
          type="button"
          onClick={() => navigate("/projects?stage=feature-list")}
          className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
        >
          Go to Feature List
        </button>
      </div>
    );
  }

  if (registryQuery.isLoading) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 rounded bg-white/5" />
          <div className="h-16 rounded-2xl bg-white/5" />
          <div className="h-16 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (registryQuery.isError) {
    return (
      <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-base font-semibold text-rose-100">Failed to load versions</div>
        <div className="mt-2 text-sm text-rose-200/90">{getErrorMessage(registryQuery.error)}</div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => registryQuery.refetch()}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
          >
            Retry
          </button>

          <button
            type="button"
            onClick={goUploadNewVersion}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
          >
            <IconPlus className="h-4 w-4" />
            Upload Docs
          </button>
        </div>
      </div>
    );
  }

  if (!versionsMeta.versions.length) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-10 text-center">
        <div className="text-xl font-semibold text-white">No versions yet</div>
        <div className="mt-2 text-sm text-slate-400">
          Upload documents to create Version 1 for this feature.
        </div>

        <button
          type="button"
          onClick={goUploadNewVersion}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500"
        >
          <IconPlus className="h-4 w-4" />
          Upload Documents (v1)
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-[22px] border border-white/8 bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
        <div>
          <div className="text-lg font-semibold text-white">Versions</div>
          <div className="mt-1 text-sm text-slate-400">
            {activeProject?.name || "Project"} / {activeFeature?.name || "Feature"}
          </div>
        </div>

        <button
          type="button"
          onClick={goUploadNewVersion}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
        >
          <IconPlus className="h-4 w-4" />
          New Version
        </button>
      </div>

      <div className="space-y-3 px-6 py-6">
        {versionsMeta.grouped.map((row) => (
          <button
            key={row.versionNumber}
            type="button"
            onClick={() => openVersion(row.versionNumber)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/6 bg-white/[0.02] px-5 py-4 text-left transition hover:border-white/10 hover:bg-white/[0.03]"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">Version v{row.versionNumber}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                {row.docTypes.length ? (
                  row.docTypes.map((d) => (
                    <span key={d} className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5">
                      {d.toUpperCase()}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">Docs uploaded</span>
                )}

                {row.indexingStatus ? (
                  <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5">
                    {row.indexingStatus}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 text-slate-300">
              <IconChevronRight className="h-5 w-5" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};