export const STAGES = [
  { key: "project-list", label: "Projects" },
  { key: "create-project", label: "Create Project" },
  { key: "feature-list", label: "Feature List" },
  { key: "create-feature", label: "Add Feature" },
  { key: "upload-documents", label: "Upload Documents" },
  { key: "feature-workspace", label: "Feature Workspace" },
  { key: "generate", label: "Generate" },
  { key: "validator", label: "Validator" },
  { key: "coverage", label: "Coverage" },
  { key: "edit", label: "Edit" },
  { key: "export", label: "Export" },
];

export const STAGE_ALIASES = {
  "add-new-feature": "create-feature",
  "project-listing": "project-list",
  "add-feature": "feature-workspace",
  "upload-prd": "upload-documents",
  "version-detail": "feature-workspace",
  "versions-list": "feature-workspace",
};

export const DEFAULT_STAGE = "project-list";

export function getStage(key) {
  return STAGES.find((s) => s.key === key) || null;
}

export function normalizeStageKey(rawKey) {
  const key = (rawKey || "").trim();
  const aliased = STAGE_ALIASES[key] || key;
  return getStage(aliased)?.key || DEFAULT_STAGE;
}

export function getStageLabel(stageKey) {
  return getStage(normalizeStageKey(stageKey))?.label || "Projects";
}

export function getStageFromSearch(search) {
  const params = new URLSearchParams(search || "");
  return normalizeStageKey(params.get("stage"));
}

export function buildStageSearch(stageKey) {
  return `stage=${encodeURIComponent(normalizeStageKey(stageKey))}`;
}

export function buildStagePath(stageKey) {
  return `/projects?${buildStageSearch(stageKey)}`;
}

export function isProjectsRoute(pathname = "") {
  return pathname === "/projects" || pathname.startsWith("/projects/");
}