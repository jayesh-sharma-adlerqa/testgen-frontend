export const STAGES = [
  { key: "project-list", label: "Projects" },
  { key: "create-project", label: "Create Project" },
  { key: "feature-list", label: "Feature List" },
  { key: "create-feature", label: "Create Feature" },
  { key: "versions-list", label: "Versions" },
  { key: "upload-documents", label: "Upload Documents" },
  { key: "version-detail", label: "Feature Details" },
  { key: "generate", label: "Generate" },
  { key: "validator", label: "Validator" },
  { key: "coverage", label: "Code Coverage" },
  { key: "edit", label: "Edit" },
  { key: "export", label: "Export" },
];

export const STAGE_ALIASES = {
  "add-new-feature": "create-feature",
  "project-listing": "project-list",
  "add-feature": "version-detail", // that step is not a separate screen in the new conditional flow
  "upload-prd": "upload-documents",
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
};