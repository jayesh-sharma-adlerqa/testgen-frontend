import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { buildCrumbs } from "./breadcrumbs";
import { useProjectFlow } from "./useProjectFlow";
import { fetchFeatureDocumentsRegistry, deriveVersionsFromRegistry } from "./featureDocsApi";
import { useProjectSessionStore } from "../store/ProjectSessionStore";

function Chevron() {
  return <span className="mx-2 text-slate-500">›</span>;
}

export default function ProjectFlowBreadcrumbs() {
  const {
    stageKey,
    activeProject,
    activeFeature,
    activeVersion,
    goToStage,
  } = useProjectFlow();

  const clearAll = useProjectSessionStore((s) => s.clearAll);
  const clearFeature = useProjectSessionStore((s) => s.clearActiveFeature);
  const clearVersion = useProjectSessionStore((s) => s.clearActiveVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";

  const registryQuery = useQuery({
    queryKey: ["projects", projectId, "features", featureId, "docs-registry"],
    enabled: Boolean(projectId && featureId),
    queryFn: async () => {
      return fetchFeatureDocumentsRegistry({ projectId, featureId });
    },
    staleTime: 10_000,
  });

  const derived = useMemo(() => {
    return deriveVersionsFromRegistry(registryQuery.data || { items: [], versions: [], latest: null });
  }, [registryQuery.data]);

  const featureHasVersions = Boolean(derived.versions.length);
  const latestVersion = derived.latest ?? null;

  const resolvedVersionNumber = useMemo(() => {
    if (Number.isFinite(activeVersion?.number)) return activeVersion.number;
    const versionRelatedStages = ["version-detail", "generate", "validator", "coverage", "edit", "export"];
    return versionRelatedStages.includes(stageKey) && Number.isFinite(latestVersion) ? latestVersion : null;
  }, [activeVersion?.number, latestVersion, stageKey]);

  const crumbs = useMemo(() => {
    const ctx = {
      project: activeProject,
      feature: activeFeature,
    };

    return buildCrumbs({
      stageKey,
      ctx,
      featureHasVersions,
      resolvedVersionNumber,
      latestVersion,
    });
  }, [activeProject, activeFeature, featureHasVersions, resolvedVersionNumber, stageKey]);

  function onCrumbClick(crumb) {
    if (!crumb?.targetStage) return;

    if (crumb.clear === "all") {
      clearAll();
      goToStage(crumb.targetStage, { replace: true });
      return;
    }

    if (crumb.clear === "feature") {
      clearFeature();
      goToStage(crumb.targetStage);
      return;
    }

    if (crumb.clear === "version") {
      clearVersion();
      goToStage(crumb.targetStage);
      return;
    }

    goToStage(crumb.targetStage);
  }

  return (
    <nav className="mb-6 flex flex-wrap items-center text-sm text-slate-300">
      {crumbs.map((c, idx) => (
        <span key={c.id} className="flex items-center">
          {idx > 0 ? <Chevron /> : null}
          <button
            type="button"
            onClick={() => onCrumbClick(c)}
            className="rounded-md px-2 py-1 text-slate-200 transition hover:bg-white/5 hover:text-white"
            title={c.label}
          >
            {c.label}
          </button>
        </span>
      ))}
    </nav>
  );
};