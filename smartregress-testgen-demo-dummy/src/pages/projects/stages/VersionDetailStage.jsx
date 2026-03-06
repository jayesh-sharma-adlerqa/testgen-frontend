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

function Badge({ children }) {
  return (
    <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-slate-200">
      {children}
    </span>
  );
}

function Button({ children, onClick, disabled, variant = "primary" }) {
  const cls =
    variant === "primary"
      ? "bg-blue-600 hover:bg-blue-500"
      : "bg-white/10 hover:bg-white/15";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2 text-sm text-white transition ${cls} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

function formatDocType(docType) {
  if (!docType) return "DOCUMENT";
  return String(docType).toUpperCase();
}

function buildDocDescription(item) {
  const parts = [];
  if (item?.sourceType) parts.push(String(item.sourceType).toUpperCase());
  if (item?.sourceValue) parts.push(item.sourceValue);
  return parts.join(" • ");
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
      return fetchFeatureDocumentsRegistry({ projectId, featureId });
    },
  });

  const resolvedVersion = useMemo(() => {
    if (Number.isFinite(activeVersion?.number)) return activeVersion.number;
    const derived = deriveVersionsFromRegistry(registryQuery.data || { items: [], versions: [], latest: null });
    return Number.isFinite(derived.latest) ? derived.latest : null;
  }, [activeVersion?.number, registryQuery.data]);

  useEffect(() => {
    if (!Number.isFinite(activeVersion?.number) && Number.isFinite(resolvedVersion)) {
      setActiveVersion(resolvedVersion);
    }
  }, [activeVersion?.number, resolvedVersion, setActiveVersion]);

  const docsQuery = useQuery({
    queryKey: ["projects", projectId, "features", featureId, "documents-by-version", resolvedVersion],
    enabled: Boolean(projectId && featureId && Number.isFinite(resolvedVersion)),
    queryFn: async () => {
      return fetchFeatureDocumentsByVersion({
        projectId,
        featureId,
        versionNumber: resolvedVersion,
      });
    },
    staleTime: 5_000,
  });

  const indexingStatus = docsQuery.data?.indexingStatus || null;
  const isReady = String(indexingStatus || "").toUpperCase() === "READY";
  const docs = Array.isArray(docsQuery.data?.items) ? docsQuery.data.items : [];

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
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 rounded bg-white/5" />
          <div className="h-20 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (registryQuery.isError) {
    return (
      <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-base font-semibold text-rose-100">Failed to resolve versions</div>
        <div className="mt-2 text-sm text-rose-200/90">{getErrorMessage(registryQuery.error)}</div>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" onClick={() => registryQuery.refetch()}>
            Retry
          </Button>
          <Button onClick={() => navigate("/projects?stage=versions-list")}>Back to Versions</Button>
        </div>
      </div>
    );
  }

  if (!Number.isFinite(resolvedVersion)) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-10 text-center">
        <div className="text-xl font-semibold text-white">No versions yet</div>
        <div className="mt-2 text-sm text-slate-400">
          Upload documents to create Version 1 for this feature.
        </div>

        <Button onClick={goNewVersion}>Upload Documents (v1)</Button>
      </div>
    );
  }

  return (
    <section className="rounded-[22px] border border-white/8 bg-white/[0.02]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 px-6 py-5">
        <div>
          <div className="text-lg font-semibold text-white">
            {activeFeature?.name || "Feature"} — v{resolvedVersion}
          </div>
          <div className="mt-1 text-sm text-slate-400">{activeProject?.name || "Project"}</div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>Index: {indexingStatus || "UNKNOWN"}</Badge>
            {isReady ? <Badge>Generation Enabled</Badge> : <Badge>Generation Disabled</Badge>}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate("/projects?stage=versions-list")}>
            Versions
          </Button>
          <Button variant="secondary" onClick={goNewVersion}>
            New Version
          </Button>
        </div>
      </div>

      <div className="px-6 py-6">
        {docsQuery.isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-48 rounded bg-white/5" />
            <div className="h-24 rounded-2xl bg-white/5" />
          </div>
        ) : docsQuery.isError ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
            Failed to load documents: {getErrorMessage(docsQuery.error)}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <div className="text-sm font-semibold text-white">Documents (Version v{resolvedVersion})</div>

            {docs.length ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {docs.map((item, idx) => (
                  <div
                    key={item.id || `${item.docType || "doc"}-${idx}`}
                    className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{item.displayName}</div>
                      <Badge>{formatDocType(item.docType)}</Badge>
                    </div>

                    {buildDocDescription(item) ? (
                      <div className="mt-2 break-all text-xs text-slate-400">{buildDocDescription(item)}</div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-500">Document metadata available</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-400">
                No document rows were returned for this version, but the version exists in the registry.
              </div>
            )}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="text-sm font-semibold text-white">Actions</div>
          <div className="mt-2 text-sm text-slate-400">
            Actions are enabled only when indexing status is READY.
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={goGenerate} disabled={!isReady}>
              Generate Tests
            </Button>
            <Button onClick={goValidator} disabled={!isReady} variant="secondary">
              Validator
            </Button>
            <Button onClick={goCoverage} disabled={!isReady} variant="secondary">
              Coverage
            </Button>
          </div>

          {!isReady ? (
            <div className="mt-4 text-xs text-slate-500">
              Index status must be READY before generation. Use “New Version” if you need to replace docs.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};