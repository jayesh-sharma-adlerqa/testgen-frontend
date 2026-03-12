import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http, getErrorMessage } from "../../../api/http";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";

function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

function IconArrowRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

function IconFolder(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3.75 7.75A2.75 2.75 0 0 1 6.5 5h3.09c.67 0 1.31.27 1.79.75l.82.82c.23.23.54.36.87.36h4.43a2.75 2.75 0 0 1 2.75 2.75v6.82a2.75 2.75 0 0 1-2.75 2.75H6.5a2.75 2.75 0 0 1-2.75-2.75V7.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
};

function IconRefresh(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66L20 8.67"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 4.75v3.92h-3.92"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

function normalizeProjectsResponse(responseData) {
  const candidates = [
    responseData?.data?.projects,
    responseData?.projects,
    responseData?.data?.items,
    responseData?.items,
    responseData?.data,
    responseData,
  ];

  const rawList = candidates.find((item) => Array.isArray(item)) || [];

  return rawList
    .map((item) => normalizeProject(item))
    .filter((item) => Boolean(item?.id));
};

function normalizeProject(item) {
  if (!item || typeof item !== "object") return null;

  const id = item.id ?? item.projectId ?? item._id ?? null;
  const name = item.name ?? "Untitled Project";
  const description = item.description ?? "";
  const updatedAt =
    item.updatedAt ??
    item.updated_at ??
    item.modifiedAt ??
    item.modified_at ??
    item.createdAt ??
    item.created_at ??
    null;

  const featureCount = getFeatureCount(item);

  if (!id) return null;

  return {
    id: String(id),
    name: String(name),
    description: description ? String(description) : "",
    featureCount,
    updatedAt: updatedAt ? String(updatedAt) : "",
  };
};

function getFeatureCount(item) {
  if (typeof item?.featureCount === "number") return item.featureCount;
  if (typeof item?.featuresCount === "number") return item.featuresCount;
  if (typeof item?.feature_count === "number") return item.feature_count;
  if (Array.isArray(item?.features)) return item.features.length;
  if (typeof item?.features === "number") return item.features;
  return 0;
};

function formatDateLabel(value) {
  if (!value) return "Recently updated";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

function EmptyState({ onCreate }) {
  return (
    <section className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
      <div className="w-full max-w-[680px] rounded-[28px] border border-dashed border-blue-400/20 bg-slate-950/20 px-8 py-12 shadow-[0_16px_70px_rgba(0,0,0,0.18)]">
        <div className="mx-auto flex w-full max-w-[520px] flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-blue-400/20 bg-slate-900/40 text-slate-400">
            <IconPlus className="h-10 w-10" />
          </div>

          <h2 className="mt-7 text-3xl font-semibold tracking-tight text-slate-100">
            No projects yet
          </h2>

          <p className="mt-4 max-w-[520px] text-sm leading-7 text-slate-400">
            Create your first project to start adding features, uploading PRD/HLD/LLD/Figma
            inputs, and continuing the TestGen workflow.
          </p>

          <button
            type="button"
            onClick={onCreate}
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:bg-blue-500"
          >
            <span>Create New Project</span>
            <IconArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

function LoadingState() {
  return (
    <div className="rounded-[28px] border border-slate-800/80 bg-[#091423] px-6 py-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded-lg bg-white/5" />
        <div className="h-16 rounded-2xl bg-white/5" />
        <div className="h-16 rounded-2xl bg-white/5" />
        <div className="h-16 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
};

function ErrorState({ message, onRetry, onCreate }) {
  return (
    <div className="rounded-[28px] border border-rose-400/20 bg-rose-500/10 px-6 py-6">
      <div className="text-base font-semibold text-rose-100">
        Unable to load projects
      </div>
      <p className="mt-2 text-sm text-rose-200/90">{message}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
        >
          <IconRefresh className="h-4 w-4" />
          <span>Retry</span>
        </button>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          <span>Create Project</span>
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

function ProjectRow({ project, onOpen }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/25 px-5 py-5 transition hover:border-slate-700 hover:bg-slate-900/30 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10">
            <IconFolder className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-white">
              {project.name}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              {project.description || "No description added yet."}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 pl-13">
          <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {project.featureCount} feature{project.featureCount === 1 ? "" : "s"}
          </span>

          <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-slate-300">
            Updated {formatDateLabel(project.updatedAt)}
          </span>
        </div>
      </div>

      <div className="shrink-0">
        <button
          type="button"
          onClick={() => onOpen(project)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          <span>Open</span>
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default function ProjectListStage() {
  const navigate = useNavigate();
  const setActiveProject = useProjectSessionStore((s) => s.setActiveProject);
  const clearActiveProject = useProjectSessionStore((s) => s.clearActiveProject);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await http.get("/projects");
      return normalizeProjectsResponse(response?.data);
    },
  });

  const projects = useMemo(() => projectsQuery.data || [], [projectsQuery.data]);

  function handleCreateProject() {
    clearActiveProject();
    navigate("/projects?stage=create-project");
  }

  function handleOpenProject(project) {
    setActiveProject({
      id: project.id,
      name: project.name,
      description: project.description,
    });

    navigate("/projects?stage=feature-list");
  }

  if (projectsQuery.isLoading) {
    return <LoadingState />;
  }

  if (projectsQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(projectsQuery.error)}
        onRetry={() => projectsQuery.refetch()}
        onCreate={handleCreateProject}
      />
    );
  }

  if (!projects.length) {
    return <EmptyState onCreate={handleCreateProject} />;
  }

  return (
    <section className="rounded-[28px] border border-slate-800/80 bg-[#091423] shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
      <div className="flex flex-col gap-4 border-b border-slate-800/80 px-6 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Projects</h2>
          <p className="mt-1 text-sm text-slate-400">
            Select a project to continue to Feature List, or create a new project.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateProject}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          <IconPlus className="h-4 w-4" />
          <span>Create Project</span>
        </button>
      </div>

      <div className="space-y-4 px-6 py-6">
        {projects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            onOpen={handleOpenProject}
          />
        ))}
      </div>
    </section>
  );
};