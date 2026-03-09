// src/pages/projects/stages/VersionDetailStage.jsx
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "../../../api/http";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";
import {
  fetchFeatureDocumentsRegistry,
  deriveVersionsFromRegistry,
  fetchFeatureDocumentsByVersion,
} from "../../../projectFlow/featureDocsApi";

function IconFile(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14.25 3.75H7.5A1.75 1.75 0 0 0 5.75 5.5v13A1.75 1.75 0 0 0 7.5 20.25h9A1.75 1.75 0 0 0 18.25 18.5V7.75l-4-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 3.75V7.5h3.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrowRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 12h14m0 0-5-5m5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconX(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepBadge({ number }) {
  return (
    <div className="inline-flex h-6 min-w-6 items-center justify-center rounded-[7px] bg-[#111B2F] px-2 text-[11px] font-medium text-slate-300">
      {number}
    </div>
  );
}

function normalizeDocType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getDocByType(items, targetType) {
  const target = normalizeDocType(targetType);
  return (items || []).find((item) => {
    const rawType =
      item?.docType ??
      item?.type ??
      item?.documentType ??
      item?.raw?.docType ??
      item?.raw?.type ??
      item?.raw?.documentType ??
      "";
    return normalizeDocType(rawType) === target;
  }) || null;
}

function getDocLabel(item, fallback) {
  if (!item) return "";

  return (
    item?.fileName ||
    item?.filename ||
    item?.originalName ||
    item?.originalFilename ||
    item?.sourceName ||
    item?.title ||
    item?.name ||
    item?.documentName ||
    item?.url ||
    item?.link ||
    item?.figmaUrl ||
    item?.pageId ||
    fallback
  );
}

function FieldValue({ value, isFile = false }) {
  return (
    <div className="flex min-h-[30px] items-center rounded-[8px] border border-[#6078A8] bg-[#20293B] px-3">
      {isFile ? (
        <IconFile className="mr-2 h-4 w-4 shrink-0 text-slate-300" />
      ) : null}

      <span className="truncate text-xs text-slate-200">{value}</span>

      <span className="ml-auto pl-3 text-slate-300">
        <IconX className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

function InfoCard({ step, label, children }) {
  return (
    <div className="rounded-[12px] bg-[#11192B] px-4 py-4">
      <div className="flex items-center gap-3">
        <StepBadge number={step} />
        <div className="text-[14px] font-medium text-white">{label}</div>
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}

function BottomActionButton({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-[34px] w-full items-center justify-center gap-2 rounded-[6px] bg-[#2D67C8] px-4 text-sm font-medium text-white transition hover:bg-[#3772D7] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>{label}</span>
      <IconArrowRight className="h-4 w-4" />
    </button>
  );
}

export default function VersionDetailStage() {
  const navigate = useNavigate();

  const activeProject = useProjectSessionStore((s) => s.activeProject);
  const activeFeature = useProjectSessionStore((s) => s.activeFeature);
  const activeVersion = useProjectSessionStore((s) => s.activeVersion);
  const setActiveVersion = useProjectSessionStore((s) => s.setActiveVersion);
  const clearActiveVersion = useProjectSessionStore((s) => s.clearActiveVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";

  const registryQuery = useQuery({
    queryKey: ["projects", projectId, "features", featureId, "docs-registry"],
    enabled: Boolean(projectId && featureId),
    queryFn: async () => {
      const items = await fetchFeatureDocumentsRegistry({ projectId, featureId });
      return deriveVersionsFromRegistry(items);
    },
  });

  const resolvedVersion = useMemo(() => {
    if (Number.isFinite(activeVersion?.number)) return activeVersion.number;
    const latest = registryQuery.data?.latest;
    return Number.isFinite(latest) ? latest : null;
  }, [activeVersion?.number, registryQuery.data?.latest]);

  useEffect(() => {
    if (!Number.isFinite(activeVersion?.number) && Number.isFinite(resolvedVersion)) {
      setActiveVersion(resolvedVersion);
    }
  }, [activeVersion?.number, resolvedVersion, setActiveVersion]);

  const docsQuery = useQuery({
    queryKey: [
      "projects",
      projectId,
      "features",
      featureId,
      "documents-by-version",
      resolvedVersion,
    ],
    enabled: Boolean(projectId && featureId && Number.isFinite(resolvedVersion)),
    queryFn: async () => {
      return fetchFeatureDocumentsByVersion({
        projectId,
        featureId,
        versionNumber: resolvedVersion,
      });
    },
    staleTime: 5000,
  });

  const items = docsQuery.data?.items || [];
  const indexingStatus = docsQuery.data?.indexingStatus || null;
  const isReady = String(indexingStatus || "").toUpperCase() === "READY";

  const prdDoc = useMemo(() => getDocByType(items, "prd"), [items]);
  const hldDoc = useMemo(() => getDocByType(items, "hld"), [items]);
  const lldDoc = useMemo(() => getDocByType(items, "lld"), [items]);
  const figmaDoc = useMemo(() => getDocByType(items, "figma"), [items]);

  function goNewVersion() {
    clearActiveVersion();
    navigate("/projects?stage=upload-documents");
  }

  function goGenerate() {
    navigate("/projects?stage=generate");
  }

  function goValidator() {
    navigate("/projects?stage=validator");
  }

  function goCoverage() {
    navigate("/projects?stage=coverage");
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
      <div className="rounded-[18px] border border-[#111A2C] bg-[#081221] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-white/5" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-24 rounded-[12px] bg-white/5" />
            <div className="h-24 rounded-[12px] bg-white/5" />
            <div className="h-24 rounded-[12px] bg-white/5" />
            <div className="h-24 rounded-[12px] bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (registryQuery.isError) {
    return (
      <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-base font-semibold text-rose-100">
          Failed to resolve versions
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
            onClick={() => navigate("/projects?stage=versions-list")}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
          >
            Back to Versions
          </button>
        </div>
      </div>
    );
  }

  if (!Number.isFinite(resolvedVersion)) {
    return (
      <div className="rounded-[18px] border border-[#111A2C] bg-[#081221] p-8 text-center">
        <div className="text-lg font-semibold text-white">No versions yet</div>
        <div className="mt-2 text-sm text-slate-400">
          Upload documents to create the first version for this feature.
        </div>

        <button
          type="button"
          onClick={goNewVersion}
          className="mt-6 rounded-[8px] bg-[#8AA8D9] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#97B4E2]"
        >
          Upload Documents
        </button>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[18px] border border-[#111A2C] bg-[#081221]">
      <div className="px-6 py-6">
        {docsQuery.isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-24 rounded-[12px] bg-white/5" />
              <div className="h-24 rounded-[12px] bg-white/5" />
              <div className="h-24 rounded-[12px] bg-white/5" />
              <div className="h-24 rounded-[12px] bg-white/5" />
              <div className="h-24 rounded-[12px] bg-white/5" />
            </div>
          </div>
        ) : docsQuery.isError ? (
          <div className="rounded-[12px] border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            Failed to load documents: {getErrorMessage(docsQuery.error)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoCard step="1" label="Feature Name">
              <FieldValue value={activeFeature?.name || "Untitled Feature"} />
            </InfoCard>

            <InfoCard step="2" label="PRD">
              {prdDoc ? (
                <FieldValue value={getDocLabel(prdDoc, "PRD")} isFile />
              ) : (
                <FieldValue value="Not uploaded" />
              )}
            </InfoCard>

            <InfoCard step="3" label="HLD">
              {hldDoc ? (
                <FieldValue value={getDocLabel(hldDoc, "HLD")} isFile />
              ) : (
                <FieldValue value="Not uploaded" />
              )}
            </InfoCard>

            <InfoCard step="4" label="LLD">
              {lldDoc ? (
                <FieldValue value={getDocLabel(lldDoc, "LLD")} isFile />
              ) : (
                <FieldValue value="Not uploaded" />
              )}
            </InfoCard>

            <InfoCard step="5" label="Figma Link">
              {figmaDoc ? (
                <FieldValue value={getDocLabel(figmaDoc, "Figma")} />
              ) : (
                <FieldValue value="Not uploaded" />
              )}
            </InfoCard>
          </div>
        )}

        <div className="mt-4 text-xs text-slate-500">
          Version {String(resolvedVersion).padStart(2, "0")}
          {indexingStatus ? ` • Indexing: ${indexingStatus}` : ""}
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-6 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <BottomActionButton
            label="Test Case"
            onClick={goGenerate}
            disabled={!isReady}
          />
          <BottomActionButton
            label="Validator"
            onClick={goValidator}
            disabled={!isReady}
          />
          <BottomActionButton
            label="Code Coverage"
            onClick={goCoverage}
            disabled={!isReady}
          />
        </div>
      </div>
    </section>
  );
};