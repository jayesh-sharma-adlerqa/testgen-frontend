import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "../../../api/http";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";
import {
  fetchFeatureDocumentsRegistry,
  deriveVersionsFromRegistry,
} from "../../../projectFlow/featureDocsApi";

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

function groupByVersion(registry) {
  const safeRegistry = Array.isArray(registry?.items)
    ? registry
    : { items: Array.isArray(registry) ? registry : [] };

  const items = safeRegistry.items;
  const derived = deriveVersionsFromRegistry(safeRegistry);
  const map = new Map();

  for (const item of items) {
    const versionNumber = item?.versionNumber;
    if (!Number.isFinite(versionNumber)) continue;

    const key = String(versionNumber);

    if (!map.has(key)) {
      map.set(key, {
        versionNumber,
        docTypes: new Set(),
        items: [],
        createdAt: item?.createdAt || null,
        indexingStatus: item?.indexingStatus || null,
      });
    }

    const bucket = map.get(key);

    if (item?.docType) bucket.docTypes.add(item.docType);
    bucket.items.push(item);

    if (item?.createdAt) bucket.createdAt = item.createdAt;
    if (item?.indexingStatus) bucket.indexingStatus = item.indexingStatus;
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
  rows.sort((a, b) => a.versionNumber - b.versionNumber);

  return rows.map((row) => ({
    ...row,
    docTypes: Array.from(row.docTypes),
  }));
}

function VersionFolderRow({ versionNumber, onOpen }) {
  const label = String(versionNumber).padStart(2, "0");

  return (
    <button
      type="button"
      onClick={() => onOpen(versionNumber)}
      className="group flex w-full items-center gap-3 rounded-[10px] border border-white/[0.04] bg-white/[0.02] px-4 py-3 text-left transition duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
    >
      <IconFolder className="h-6 w-6 shrink-0 text-[#D9D285]" />
      <span className="truncate text-sm font-medium text-slate-200">
        Version {label}
      </span>
    </button>
  );
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

  function openVersion(versionNumber) {
    setActiveVersion(versionNumber);
    navigate("/projects?stage=version-detail");
  }

  if (!projectId || !featureId) {
    return (
      <div className="rounded-[18px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">No feature selected</div>
        <div className="mt-2 text-sm text-slate-400">
          Please select a feature first.
        </div>
        <button
          type="button"
          onClick={() => navigate("/projects?stage=feature-list")}
          className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
        >
          Go to Feature List
        </button>
      </div>
    );
  }

  if (registryQuery.isLoading) {
    return (
      <div className="rounded-[18px] border border-white/8 bg-white/[0.02] p-6">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-[50px] rounded-[10px] border border-white/[0.04] bg-white/[0.02]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (registryQuery.isError) {
    return (
      <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-base font-semibold text-rose-100">
          Failed to load versions
        </div>
        <div className="mt-2 text-sm text-rose-200/90">
          {getErrorMessage(registryQuery.error)}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => registryQuery.refetch()}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
          >
            Retry
          </button>

          <button
            type="button"
            onClick={goUploadNewVersion}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
          >
            Upload Docs
          </button>
        </div>
      </div>
    );
  }

  if (!versionsMeta.versions.length) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="w-full max-w-[520px] rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-8 py-12 text-center">
          <div className="text-lg font-semibold text-white">No versions yet</div>
          <div className="mt-2 text-sm text-slate-400">
            Upload documents to create Version 01 for this feature.
          </div>

          <button
            type="button"
            onClick={goUploadNewVersion}
            className="mt-8 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Upload Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="relative min-h-[520px] w-full">
      <div className="space-y-3">
        {versionsMeta.grouped.map((row) => (
          <VersionFolderRow
            key={row.versionNumber}
            versionNumber={row.versionNumber}
            onOpen={openVersion}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={goUploadNewVersion}
        className="fixed bottom-8 right-8 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/6 bg-[#1A2435] text-white shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition hover:bg-[#243147]"
        title="Create new version"
        aria-label="Create new version"
      >
        <IconPlus className="h-6 w-6" />
      </button>
    </section>
  );
};