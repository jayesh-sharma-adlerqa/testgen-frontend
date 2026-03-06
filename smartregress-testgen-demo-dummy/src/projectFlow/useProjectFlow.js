// src/projectFlow/useProjectFlow.js
import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { buildStagePath, getStageFromSearch, isProjectsRoute, normalizeStageKey } from "./flowConfig";
import { getGuardRedirectStage } from "./guards";
import { useProjectSessionStore } from "../store/ProjectSessionStore";

function mergeSearchParams(current, updates) {
  const next = new URLSearchParams(current);
  Object.entries(updates || {}).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") next.delete(k);
    else next.set(k, String(v));
  });
  return next;
}

export function useProjectFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeProject = useProjectSessionStore((s) => s.activeProject);
  const activeFeature = useProjectSessionStore((s) => s.activeFeature);
  const activeVersion = useProjectSessionStore((s) => s.activeVersion);

  const clearAll = useProjectSessionStore((s) => s.clearAll);
  const clearFeature = useProjectSessionStore((s) => s.clearActiveFeature);
  const clearVersion = useProjectSessionStore((s) => s.clearActiveVersion);

  const isOnProjects = useMemo(() => isProjectsRoute(location.pathname), [location.pathname]);

  const stageKey = useMemo(() => {
    if (!isOnProjects) return "project-list";
    return getStageFromSearch(location.search);
  }, [isOnProjects, location.search]);

  // Apply guard redirects when stage/context mismatches (clean URL = guards are mandatory)
  useEffect(() => {
    if (!isOnProjects) return;

    const ctx = {
      project: activeProject,
      feature: activeFeature,
      versionNumber: activeVersion?.number,
    };

    const nextStage = getGuardRedirectStage(stageKey, ctx);

    if (normalizeStageKey(stageKey) !== normalizeStageKey(nextStage)) {
      // replace to avoid polluting browser history with invalid stages
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
    (nextStage, opts = {}) => {
      if (!isOnProjects) return;

      const normalized = normalizeStageKey(nextStage);
      const next = mergeSearchParams(searchParams, { stage: normalized });

      setSearchParams(next, { replace: Boolean(opts.replace) });
    },
    [isOnProjects, searchParams, setSearchParams]
  );

  const goToProjectsRoot = useCallback(() => {
    clearAll();
    navigate(buildStagePath("project-list"), { replace: true });
  }, [clearAll, navigate]);

  const goToProject = useCallback(() => {
    clearFeature(); // also clears version inside store
    goToStage("feature-list");
  }, [clearFeature, goToStage]);

  const goToFeature = useCallback(
    (featureHasVersions) => {
      clearVersion();
      goToStage(featureHasVersions ? "versions-list" : "upload-documents");
    },
    [clearVersion, goToStage]
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
}
