import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useAuthStore } from "../store/AuthStore";
import { useProjectSessionStore } from "../store/ProjectSessionStore";
import { getStageFromSearch, getStageLabel, isProjectsRoute } from "../projectFlow/flowConfig";

function IconLogout(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 7V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M4 12h10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M8 8l-4 4 4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

const TITLE_MAP = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Projects", to: "/projects" },
  { label: "Settings", to: "/settings" },
];

function getTitleFromPath(pathname) {
  const hit = TITLE_MAP.find((i) => pathname === i.to || pathname.startsWith(i.to + "/"));
  return hit?.label || "";
}

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const doLocalLogout = useAuthStore((s) => s.logout);

  const activeProject = useProjectSessionStore((s) => s.activeProject);
  const activeFeature = useProjectSessionStore((s) => s.activeFeature);
  const activeVersion = useProjectSessionStore((s) => s.activeVersion);

  const [loggingOut, setLoggingOut] = useState(false);

  const isProjects = useMemo(() => isProjectsRoute(location.pathname), [location.pathname]);

  const title = useMemo(() => {
    if (!isProjects) {
      return getTitleFromPath(location.pathname);
    }

    const stage = getStageFromSearch(location.search);

    if (["feature-workspace", "generate", "validator", "coverage", "edit", "export"].includes(stage) && activeFeature?.name) {
      return activeVersion?.number && stage !== "upload-documents"
        ? `${activeFeature.name} • v${activeVersion.number}`
        : activeFeature.name;
    }

    if (["feature-list", "create-feature"].includes(stage) && activeProject?.name) {
      return activeProject.name;
    }

    if (stage === "upload-documents" && activeFeature?.name) {
      return `${activeFeature.name} • Upload`;
    }

    return getStageLabel(stage);
  }, [
    isProjects,
    location.pathname,
    location.search,
    activeProject?.name,
    activeFeature?.name,
    activeVersion?.number,
  ]);

  async function onLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await http.post("/auth/logout");
    } catch {
      //
    } finally {
      doLocalLogout();
      navigate("/login", { replace: true });
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/40 px-4 backdrop-blur md:px-6">
      <div className="min-w-0 flex flex-1 items-center">
        <div className="truncate text-sm font-medium text-slate-200">{title}</div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        className="inline-flex items-center justify-center rounded-full bg-white/5 p-2 text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        title="Logout"
        aria-label="Logout"
      >
        <IconLogout className="h-5 w-5" />
      </button>
    </header>
  );
};