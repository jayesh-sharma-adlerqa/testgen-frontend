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

const DOC_ORDER = ["prd", "hld", "lld", "figma"];

function StepBadge({ number }) {
  return (
    <div className="inline-flex h-6 min-w-6 items-center justify-center rounded-[7px] bg-[#111B2F] px-2 text-[11px] font-medium text-slate-300">
      {number}
    </div>
  );
}

function IconDocument(props) {
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

function IconLink(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 14 8.25 15.75a3.182 3.182 0 1 1-4.5-4.5L7 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 10 15.75 8.25a3.182 3.182 0 1 1 4.5 4.5L17 16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m8.5 15.5 7-7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChevronDown(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 10l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrowRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 12h14M13 6l6 6-6 6"
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
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizeDocTypeLabel(type) {
  const value = String(type || "").trim().toLowerCase();

  if (value === "prd") return "PRD";
  if (value === "hld") return "HLD";
  if (value === "lld") return "LLD";
  if (value === "figma") return "Figma Link";

  return value ? value.toUpperCase() : "Document";
}

function getDocByType(items, docType) {
  return (items || []).find((item) => String(item?.docType || "").toLowerCase() === docType) || null;
}

function getDocDisplayValue(item) {
  if (!item) return "Not uploaded";
  return item.displayName || item.sourceValue || normalizeDocTypeLabel(item.docType);
}

function getStatusTone(status) {
  const normalized = String(status || "").trim().toUpperCase();

  if (normalized === "READY") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  }

  if (normalized === "INDEXING") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-200";
  }

  if (normalized === "FAILED") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-200";
  }

  return "border-white/8 bg-white/5 text-slate-200";
}

function DocCard({ step, label, value, icon = "file", muted = false }) {
  const Icon = icon === "link" ? IconLink : IconDocument;

  return (
    <div className="rounded-[16px] border border-[#0E1626] bg-[#0D1627] px-4 py-5">
      <div className="mb-4 flex items-center gap-3">
        <StepBadge number={step} />
        <div className="text-[15px] font-medium text-white">{label}</div>
      </div>

      <div className="flex min-h-[42px] items-center rounded-[10px] border border-[#6078A8] bg-[#2A3345] px-3 text-sm text-slate-200">
        <Icon className="mr-2 h-4 w-4 shrink-0 text-slate-300" />
        <span
          className={[
            "truncate",
            muted ? "text-slate-400" : "text-slate-200",
          ].join(" ")}
        >
          {value}
        </span>
        <span className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-slate-300">
          <IconX className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function FeatureNameCard({ value }) {
  return (
    <div className="rounded-[16px] border border-[#0E1626] bg-[#0D1627] px-4 py-5">
      <div className="mb-4 flex items-center gap-3">
        <StepBadge number="1" />
        <div className="text-[15px] font-medium text-white">Feature Name</div>
      </div>

      <div className="flex min-h-[42px] items-center rounded-[10px] border border-[#6078A8] bg-[#2A3345] px-3 text-sm text-slate-200">
        <span className="truncate">{value || "Unnamed feature"}</span>
        <span className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-slate-300">
          <IconX className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#3B68BF] px-4 text-sm font-medium text-white transition hover:bg-[#4674CF] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
    >
      <span>{label}</span>
      <IconArrowRight className="h-4 w-4" />
    </button>
  );
}

function WorkspaceSkeleton() {
  return (
    <section className="w-full animate-pulse">
      <div className="rounded-[18px] border border-[#111A2C] bg-[#081221] px-6 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
        <div className="h-6 w-48 rounded bg-white/5" />
        <div className="mt-6 h-11 w-full rounded-[10px] bg-white/5" />
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[16px] border border-white/5 bg-white/[0.02] p-5"
            >
              <div className="h-5 w-28 rounded bg-white/5" />
              <div className="mt-4 h-11 w-full rounded-[10px] bg-white/5" />
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-white/5 pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[46px] rounded-[8px] bg-white/5" />
            ))}
          </div>
          <div className="mx-auto mt-4 h-[42px] w-56 rounded-[8px] bg-white/5" />
        </div>
      </div>
    </section>
  );
}

export default function FeatureWorkspaceStage() {
  const navigate = useNavigate();

  const activeProject = useProjectSessionStore((state) => state.activeProject);
  const activeFeature = useProjectSessionStore((state) => state.activeFeature);
  const activeVersion = useProjectSessionStore((state) => state.activeVersion);
  const setActiveVersion = useProjectSessionStore((state) => state.setActiveVersion);
  const clearActiveVersion = useProjectSessionStore((state) => state.clearActiveVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";

  const registryQuery = useQuery({
    queryKey: ["projects", projectId, "features", featureId, "docs-registry"],
    enabled: Boolean(projectId && featureId),
    queryFn: async () => fetchFeatureDocumentsRegistry({ projectId, featureId }),
    staleTime: 5_000,
  });

  const versionsMeta = useMemo(() => {
    return deriveVersionsFromRegistry(registryQuery.data || { items: [], versions: [], latest: null });
  }, [registryQuery.data]);

  const resolvedVersionNumber =
    Number.isFinite(activeVersion?.number)
      ? activeVersion.number
      : Number.isFinite(versionsMeta?.latest)
        ? versionsMeta.latest
        : null;

  useEffect(() => {
    if (!Number.isFinite(activeVersion?.number) && Number.isFinite(resolvedVersionNumber)) {
      setActiveVersion(resolvedVersionNumber);
    }
  }, [activeVersion?.number, resolvedVersionNumber, setActiveVersion]);

  const docsQuery = useQuery({
    queryKey: [
      "projects",
      projectId,
      "features",
      featureId,
      "documents-by-version",
      resolvedVersionNumber,
    ],
    enabled: Boolean(projectId && featureId && Number.isFinite(resolvedVersionNumber)),
    queryFn: async () =>
      fetchFeatureDocumentsByVersion({
        projectId,
        featureId,
        versionNumber: resolvedVersionNumber,
      }),
    staleTime: 5_000,
  });

  const items = docsQuery.data?.items || [];
  const indexingStatus = docsQuery.data?.indexingStatus || null;
  const hasPrd = Boolean(getDocByType(items, "prd"));

  const canRunActions = Boolean(
    Number.isFinite(resolvedVersionNumber) &&
      hasPrd &&
      String(indexingStatus || "").toUpperCase() === "READY"
  );

  const orderedDocuments = useMemo(() => {
    return DOC_ORDER.map((docType) => ({
      key: docType,
      item: getDocByType(items, docType),
    }));
  }, [items]);

  const sortedVersions = useMemo(() => {
    return [...(versionsMeta.versions || [])].sort((a, b) => b - a);
  }, [versionsMeta.versions]);

  function goToUpload() {
    clearActiveVersion();
    navigate("/projects?stage=upload-documents");
  }

  function onVersionChange(event) {
    const nextValue = Number(event.target.value);
    if (!Number.isFinite(nextValue)) return;
    setActiveVersion(nextValue);
  }

  if (!projectId || !featureId) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">No feature selected</div>
        <div className="mt-2 text-sm text-slate-400">Please open a project and feature first.</div>
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

  if (registryQuery.isLoading || (Number.isFinite(resolvedVersionNumber) && docsQuery.isLoading)) {
    return <WorkspaceSkeleton />;
  }

  if (registryQuery.isError) {
    return (
      <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-base font-semibold text-rose-100">Failed to load feature versions</div>
        <div className="mt-2 text-sm text-rose-200/90">{getErrorMessage(registryQuery.error)}</div>
      </div>
    );
  }

  if (docsQuery.isError) {
    return (
      <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-base font-semibold text-rose-100">Failed to load uploaded documents</div>
        <div className="mt-2 text-sm text-rose-200/90">{getErrorMessage(docsQuery.error)}</div>
      </div>
    );
  }

  if (!sortedVersions.length || !Number.isFinite(resolvedVersionNumber)) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">No feature version found</div>
        <div className="mt-2 text-sm text-slate-400">
          Upload PRD/HLD/LLD/Figma documents first to create the first version for this feature.
        </div>
        <button
          type="button"
          onClick={goToUpload}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
        >
          Upload Documents
        </button>
      </div>
    );
  }

  const prdItem = orderedDocuments.find((entry) => entry.key === "prd")?.item || null;
  const hldItem = orderedDocuments.find((entry) => entry.key === "hld")?.item || null;
  const lldItem = orderedDocuments.find((entry) => entry.key === "lld")?.item || null;
  const figmaItem = orderedDocuments.find((entry) => entry.key === "figma")?.item || null;

  return (
    <section className="w-full">
      {String(indexingStatus || "").toUpperCase() !== "READY" ? (
        <div className="mb-4 rounded-[16px] border border-amber-400/15 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Generation actions stay disabled until this version reaches READY.
        </div>
      ) : null}

      {!hasPrd ? (
        <div className="mb-4 rounded-[16px] border border-rose-400/15 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          PRD is missing for this version, so Test Case and Validator actions are disabled.
        </div>
      ) : null}

      <div className="rounded-[18px] border border-[#111A2C] bg-[#081221] px-6 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <IconDocument className="h-4 w-4 text-slate-300" />
              Feature Workspace
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {activeProject?.name || "Project"} / {activeFeature?.name || "Feature"}
            </div>
          </div>

          <span className={["rounded-full border px-3 py-1 text-xs", getStatusTone(indexingStatus)].join(" ")}>
            Index: {String(indexingStatus || "UNKNOWN").toUpperCase()}
          </span>
        </div>

        <div className="mt-6 rounded-[16px] border border-[#0E1626] bg-[#0B1423] p-4">
          <div className="mb-3 text-[13px] font-medium text-white">Version</div>
          <div className="relative">
            <select
              value={resolvedVersionNumber}
              onChange={onVersionChange}
              className="h-[42px] w-full appearance-none rounded-[10px] border border-[#31415D] bg-[#1A2334] px-3 pr-10 text-sm text-slate-200 outline-none transition focus:border-[#6078A8]"
            >
              {sortedVersions.map((version) => (
                <option key={version} value={version}>
                  Version {String(version).padStart(2, "0")}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <FeatureNameCard value={activeFeature?.name} />

          <DocCard
            step="2"
            label="PRD"
            value={getDocDisplayValue(prdItem)}
            muted={!prdItem}
          />

          <DocCard
            step="3"
            label="HLD"
            value={getDocDisplayValue(hldItem)}
            muted={!hldItem}
          />

          <DocCard
            step="4"
            label="LLD"
            value={getDocDisplayValue(lldItem)}
            muted={!lldItem}
          />

          <DocCard
            step="5"
            label="Figma Link"
            value={getDocDisplayValue(figmaItem)}
            icon="link"
            muted={!figmaItem}
          />
        </div>

        <div className="mt-8 border-t border-[#0E1626] pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <ActionButton
              label="Test Case"
              onClick={() => navigate("/projects?stage=generate")}
              disabled={!canRunActions}
            />
            <ActionButton
              label="Validator"
              onClick={() => navigate("/projects?stage=validator")}
              disabled={!canRunActions}
            />
            <ActionButton
              label="Code Coverage"
              onClick={() => navigate("/projects?stage=coverage")}
              disabled={!canRunActions}
            />
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={goToUpload}
              className="rounded-[8px] bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Upload New Version
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}