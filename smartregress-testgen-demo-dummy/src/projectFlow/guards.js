// src/projectFlow/guards.js
import { normalizeStageKey } from "./flowConfig";

export const STAGE_REQUIREMENTS = {
  "project-list": { project: false, feature: false, version: false },
  "create-project": { project: false, feature: false, version: false },

  "feature-list": { project: true, feature: false, version: false },
  "create-feature": { project: true, feature: false, version: false },

  "versions-list": { project: true, feature: true, version: false },
  "upload-documents": { project: true, feature: true, version: false },

  // Version is "soft-required": if not selected yet, VersionDetail can resolve latest.
  "version-detail": { project: true, feature: true, version: false },

  // For generation screens, we require a resolved version.
  "generate": { project: true, feature: true, version: true },
  "validator": { project: true, feature: true, version: true },
  "coverage": { project: true, feature: true, version: true },
  "edit": { project: true, feature: true, version: true },
  "export": { project: true, feature: true, version: true },
};

function req(stageKey) {
  return STAGE_REQUIREMENTS[normalizeStageKey(stageKey)] || STAGE_REQUIREMENTS["project-list"];
}

export function getGuardRedirectStage(stageKey, ctx) {
  const s = normalizeStageKey(stageKey);
  const r = req(s);

  const hasProject = Boolean(ctx?.project?.id);
  const hasFeature = Boolean(ctx?.feature?.id);
  const hasVersion = typeof ctx?.versionNumber === "number" && !Number.isNaN(ctx.versionNumber);

  if (r.project && !hasProject) return "project-list";
  if (r.feature && !hasFeature) return "feature-list";
  if (r.version && !hasVersion) return "version-detail";

  return s;
}

export function getRequirements(stageKey) {
  return req(stageKey);
}
