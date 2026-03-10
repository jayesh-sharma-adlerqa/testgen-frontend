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
  const { stageKey, activeProject, activeFeature, activeVersion, goToStage } = useProjectFlow();

  const clearAll = useProjectSessionStore((state) => state.clearAll);
  const clearFeature = useProjectSessionStore((state) => state.clearActiveFeature);
  const clearVersion = useProjectSessionStore((state) => state.clearActiveVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";

  const registryQuery = useQuery({
    queryKey: ["projects", projectId, "features", featureId, "docs-registry"],
    enabled: Boolean(projectId && featureId),
    queryFn: async () => fetchFeatureDocumentsRegistry({ projectId, featureId }),
    staleTime: 10_000,
  });

  const derived = useMemo(() => {
    return deriveVersionsFromRegistry(registryQuery.data || { items: [], versions: [], latest: null });
  }, [registryQuery.data]);

  const featureHasDocuments = Boolean(derived.versions.length || registryQuery.data?.items?.length);

  const resolvedVersionNumber = useMemo(() => {
    if (Number.isFinite(activeVersion?.number)) return activeVersion.number;

    const versionAwareStages = ["generate", "validator", "coverage", "edit", "export"];
    return versionAwareStages.includes(stageKey) && Number.isFinite(derived.latest) ? derived.latest : null;
  }, [activeVersion?.number, derived.latest, stageKey]);

  const crumbs = useMemo(() => {
    return buildCrumbs({
      stageKey,
      ctx: {
        project: activeProject,
        feature: activeFeature,
      },
      featureHasDocuments,
      resolvedVersionNumber,
    });
  }, [activeProject, activeFeature, featureHasDocuments, resolvedVersionNumber, stageKey]);

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
      {crumbs.map((crumb, index) => (
        <span key={crumb.id} className="flex items-center">
          {index > 0 ? <Chevron /> : null}
          <button
            type="button"
            onClick={() => onCrumbClick(crumb)}
            className="rounded-md px-2 py-1 text-slate-200 transition hover:bg-white/5 hover:text-white"
            title={crumb.label}
          >
            {crumb.label}
          </button>
        </span>
      ))}
    </nav>
  );
};