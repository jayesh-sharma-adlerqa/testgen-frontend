import { getStageLabel, normalizeStageKey } from "./flowConfig";

export function buildCrumbs({ stageKey, ctx, featureHasDocuments, resolvedVersionNumber }) {
  const normalizedStage = normalizeStageKey(stageKey);

  const crumbs = [
    {
      id: "crumb-projects",
      label: "Projects",
      targetStage: "project-list",
      clear: "all",
    },
  ];

  if (normalizedStage === "create-project") {
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

  if (normalizedStage === "feature-list") {
    crumbs.push({
      id: "crumb-feature-list",
      label: getStageLabel("feature-list"),
      targetStage: "feature-list",
      clear: null,
    });
    return crumbs;
  }

  if (normalizedStage === "create-feature") {
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
    targetStage: featureHasDocuments ? "feature-workspace" : "upload-documents",
    clear: null,
  });

  if (normalizedStage === "upload-documents") {
    crumbs.push({
      id: "crumb-upload-documents",
      label: getStageLabel("upload-documents"),
      targetStage: "upload-documents",
      clear: null,
    });
    return crumbs;
  }

  if (
    ["generate", "validator", "coverage", "edit", "export"].includes(normalizedStage) &&
    Number.isFinite(resolvedVersionNumber)
  ) {
    crumbs.push({
      id: "crumb-version",
      label: `Version ${String(resolvedVersionNumber).padStart(2, "0")}`,
      targetStage: "feature-workspace",
      clear: null,
    });
  }

  const leafLabel = getStageLabel(normalizedStage);
  const stageAlreadyRepresented = crumbs.some(
    (crumb) => crumb.targetStage === normalizedStage || crumb.label === leafLabel
  );

  if (!stageAlreadyRepresented && normalizedStage !== "project-list") {
    crumbs.push({
      id: `crumb-${normalizedStage}`,
      label: leafLabel,
      targetStage: normalizedStage,
      clear: null,
    });
  }

  return crumbs;
};