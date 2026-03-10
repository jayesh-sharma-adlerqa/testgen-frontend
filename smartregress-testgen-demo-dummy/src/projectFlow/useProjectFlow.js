import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { buildStagePath, getStageFromSearch, isProjectsRoute, normalizeStageKey } from "./flowConfig";
import { getGuardRedirectStage } from "./guards";
import { useProjectSessionStore } from "../store/ProjectSessionStore";

function mergeSearchParams(current, updates) {
  const next = new URLSearchParams(current);

  Object.entries(updates || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      next.delete(key);
      return;
    }

    next.set(key, String(value));
  });

  return next;
}

export function useProjectFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeProject = useProjectSessionStore((state) => state.activeProject);
  const activeFeature = useProjectSessionStore((state) => state.activeFeature);
  const activeVersion = useProjectSessionStore((state) => state.activeVersion);

  const clearAll = useProjectSessionStore((state) => state.clearAll);
  const clearFeature = useProjectSessionStore((state) => state.clearActiveFeature);
  const clearVersion = useProjectSessionStore((state) => state.clearActiveVersion);
  const setActiveVersion = useProjectSessionStore((state) => state.setActiveVersion);

  const isOnProjects = useMemo(() => isProjectsRoute(location.pathname), [location.pathname]);

  const stageKey = useMemo(() => {
    if (!isOnProjects) return "project-list";
    return getStageFromSearch(location.search);
  }, [isOnProjects, location.search]);

  useEffect(() => {
    if (!isOnProjects) return;

    const ctx = {
      project: activeProject,
      feature: activeFeature,
      versionNumber: activeVersion?.number,
    };

    const nextStage = getGuardRedirectStage(stageKey, ctx);

    if (normalizeStageKey(stageKey) !== normalizeStageKey(nextStage)) {
      setSearchParams(mergeSearchParams(searchParams, { stage: nextStage }), { replace: true });
    }
  }, [
    isOnProjects,
    stageKey,
    activeProject,
    activeFeature,
    activeVersion?.number,
    searchParams,
    setSearchParams,
  ]);

  const goToStage = useCallback(
    (nextStage, options = {}) => {
      if (!isOnProjects) return;

      const normalizedStage = normalizeStageKey(nextStage);
      const nextSearch = mergeSearchParams(searchParams, { stage: normalizedStage });
      setSearchParams(nextSearch, { replace: Boolean(options.replace) });
    },
    [isOnProjects, searchParams, setSearchParams]
  );

  const goToProjectsRoot = useCallback(() => {
    clearAll();
    navigate(buildStagePath("project-list"), { replace: true });
  }, [clearAll, navigate]);

  const goToProject = useCallback(() => {
    clearFeature();
    goToStage("feature-list");
  }, [clearFeature, goToStage]);

  const goToFeature = useCallback(
    ({ hasDocuments = false, latestVersion = null } = {}) => {
      if (Number.isFinite(latestVersion)) {
        setActiveVersion(latestVersion);
      } else {
        clearVersion();
      }

      goToStage(hasDocuments ? "feature-workspace" : "upload-documents");
    },
    [clearVersion, goToStage, setActiveVersion]
  );

  return {
    isOnProjects,
    stageKey,

    activeProject,
    activeFeature,
    activeVersion,

    goToStage,
    goToProjectsRoot,
    goToProject,
    goToFeature,
  };
};