import { useMemo } from "react";
import { useProjectFlow } from "../../projectFlow/useProjectFlow";
import ProjectFlowBreadcrumbs from "../../projectFlow/ProjectFlowBreadcrumbs";

import ProjectListStage from "./stages/ProjectListStage";
import CreateProjectStage from "./stages/CreateProjectStage";
import FeatureListStage from "./stages/FeatureListStage";
import AddNewFeatureStage from "./stages/AddNewFeatureStage";
import UploadDocumentsStage from "./stages/UploadDocumentsStage";
import VersionsListStage from "./stages/VersionsListStage";
import VersionDetailStage from "./stages/VersionDetailStage";
import GenerateStage from "./stages/GenerateStage";
import EditStage from "./stages/EditStage";
import ExportStage from "./stages/ExportStage";

function UnknownStage({ stageKey }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
      <div className="text-sm font-medium text-slate-200">Unknown stage</div>
      <div className="mt-1 text-xs text-slate-400">stage = {stageKey}</div>
    </div>
  );
}

const STAGE_COMPONENTS = {
  "project-list": ProjectListStage,
  "create-project": CreateProjectStage,
  "feature-list": FeatureListStage,
  "create-feature": AddNewFeatureStage,
  "add-new-feature": AddNewFeatureStage,
  "versions-list": VersionsListStage,
  "upload-documents": UploadDocumentsStage,
  "version-detail": VersionDetailStage,
  "generate": GenerateStage,
  "validator": GenerateStage,
  "coverage": GenerateStage,
  "edit": EditStage,
  "export": ExportStage,
};

export default function ProjectFlowPage() {
  const { stageKey } = useProjectFlow();

  const StageComponent = useMemo(() => {
    return STAGE_COMPONENTS[stageKey] || null;
  }, [stageKey]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <ProjectFlowBreadcrumbs />

      {StageComponent ? <StageComponent /> : <UnknownStage stageKey={stageKey} />}
    </div>
  );
};