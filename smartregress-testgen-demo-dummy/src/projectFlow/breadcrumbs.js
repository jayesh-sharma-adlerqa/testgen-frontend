import { getStageLabel, normalizeStageKey } from "./flowConfig";

export function buildCrumbs({
  stageKey,
  ctx,
  featureHasVersions,
  resolvedVersionNumber,
  latestVersion,
}) {
  const s = normalizeStageKey(stageKey);

  const crumbs = [
    {
      id: "crumb-projects",
      label: "Projects",
      targetStage: "project-list",
      clear: "all",
    },
  ];

  if (s === "create-project") {
    crumbs.push({
      id: "crumb-create-project",
      label: getStageLabel("create-project"),
      targetStage: "create-project",
      clear: null,
    });
    return crumbs;
  }

  const project = ctx?.project;
  const feature = ctx?.feature;

  if (!project?.id) {
    return crumbs;
  }

  crumbs.push({
    id: "crumb-project",
    label: project.name || "Project",
    targetStage: "feature-list",
    clear: "feature",
  });

  if (s === "feature-list") {
    crumbs.push({
      id: "crumb-feature-list",
      label: getStageLabel("feature-list"),
      targetStage: "feature-list",
      clear: null,
    });
    return crumbs;
  }

  if (s === "create-feature") {
    crumbs.push({
      id: "crumb-create-feature",
      label: getStageLabel("create-feature"),
      targetStage: "create-feature",
      clear: null,
    });
    return crumbs;
  }

  if (!feature?.id) {
    return crumbs;
  }

  crumbs.push({
    id: "crumb-feature",
    label: feature.name || "Feature",
    targetStage: featureHasVersions ? "versions-list" : "upload-documents",
    clear: "version",
  });

  if (s === "upload-documents") {
    if (featureHasVersions && Number.isFinite(latestVersion)) {
      crumbs.push({
        id: "crumb-latest-version",
        label: `Version ${String(latestVersion).padStart(2, "0")}`,
        targetStage: "version-detail",
        clear: null,
      });

      crumbs.push({
        id: "crumb-create-version",
        label: "Create Version",
        targetStage: "upload-documents",
        clear: null,
      });
    } else {
      crumbs.push({
        id: "crumb-upload-documents",
        label: getStageLabel("upload-documents"),
        targetStage: "upload-documents",
        clear: null,
      });
    }

    return crumbs;
  }

  if (s === "versions-list") {
    crumbs.push({
      id: "crumb-versions-list",
      label: getStageLabel("versions-list"),
      targetStage: "versions-list",
      clear: null,
    });
    return crumbs;
  }

  if (Number.isFinite(resolvedVersionNumber)) {
    crumbs.push({
      id: "crumb-version",
      label: `Version ${String(resolvedVersionNumber).padStart(2, "0")}`,
      targetStage: "version-detail",
      clear: null,
    });
  }

  const leafLabel = getStageLabel(s);
  const stageAlreadyRepresented =
    s === "version-detail" ||
    crumbs.some((crumb) => crumb.targetStage === s || crumb.label === leafLabel);

  if (!stageAlreadyRepresented && s !== "project-list") {
    crumbs.push({
      id: `crumb-${s}`,
      label: leafLabel,
      targetStage: s,
      clear: null,
    });
  }

  return crumbs;
};