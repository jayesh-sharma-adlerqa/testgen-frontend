import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http, getErrorMessage } from "../../../api/http";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";

function StepBadge({ number }) {
  return (
    <div className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-white/8 bg-white/5 px-2 text-xs font-semibold text-slate-200">
      {number}
    </div>
  );
};

function IconField(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6.75 4.75h10.5a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2V6.75a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8.5 9.25h7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8.5 13h4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
};

function IconDescription(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.75 19.25h3.1l9.52-9.52a2.03 2.03 0 1 0-2.87-2.86L4.98 16.38l-.23 2.87Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12.75 8.75l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function normalizeCreatedFeatureResponse(responseData) {
  const candidates = [
    responseData?.data?.feature,
    responseData?.feature,
    responseData?.data,
    responseData,
  ].filter(Boolean);

  for (const item of candidates) {
    const id = item?.id ?? item?.featureId ?? item?._id ?? null;
    const name = item?.name ?? null;
    const description = item?.description ?? null;

    if (id) {
      return {
        id: String(id),
        name: name ? String(name) : "",
        description: description ? String(description) : "",
      };
    }
  }

  return null;
};

export default function AddNewFeatureStage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeProject = useProjectSessionStore((s) => s.activeProject);
  const setActiveFeature = useProjectSessionStore((s) => s.setActiveFeature);

  const projectId = activeProject?.id || "";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const trimmedDescription = useMemo(() => description.trim(), [description]);

  const nameError = hasTriedSubmit && !trimmedName ? "Feature name is required." : "";

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await http.post(`/projects/${projectId}/features`, {
        name: trimmedName,
        description: trimmedDescription,
      });

      const created = normalizeCreatedFeatureResponse(res?.data);
      if (!created?.id) {
        throw new Error("Feature created, but feature id was not returned by the API.");
      }
      return created;
    },
    onSuccess: async (created) => {
      setActiveFeature({
        id: created.id,
        name: created.name || trimmedName,
        description: created.description || trimmedDescription,
      });

      await queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "features"],
      });

      navigate("/projects?stage=upload-documents");
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    setHasTriedSubmit(true);
    if (!trimmedName) return;
    createMutation.mutate();
  }

  if (!projectId) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">No project selected</div>
        <div className="mt-2 text-sm text-slate-400">
          Please open a project first (Project List → Open).
        </div>
        <button
          type="button"
          onClick={() => navigate("/projects?stage=project-list")}
          className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
        >
          Go to Project List
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-[26px] border border-white/8 bg-white/[0.02] p-10 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <form onSubmit={handleSubmit} className="space-y-10">
          <section>
            <div className="mb-4 flex items-center gap-3">
              <StepBadge number="1" />
              <div className="text-sm font-semibold text-white">Feature Name</div>
            </div>

            <div
              className={[
                "flex min-h-[44px] items-center gap-3 rounded-[10px] border bg-white/[0.03] px-4 transition",
                nameError ? "border-rose-400/70" : "border-white/8",
              ].join(" ")}
            >
              <IconField className="h-5 w-5 shrink-0 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="Enter Feature Name"
                className="h-full w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>

            {nameError ? <div className="mt-2 text-sm text-rose-300">{nameError}</div> : null}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <StepBadge number="2" />
              <div className="text-sm font-semibold text-white">Description</div>
            </div>

            <div className="rounded-[12px] border border-white/8 bg-white/[0.03] px-4 py-4">
              <div className="flex items-start gap-3">
                <IconDescription className="mt-1 h-5 w-5 shrink-0 text-slate-500" />
                <textarea
                  value={description}
                  onChange={(ev) => setDescription(ev.target.value)}
                  placeholder="About your project.."
                  rows={6}
                  className="w-full resize-none border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </div>
          </section>

          {createMutation.isError ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {getErrorMessage(createMutation.error)}
            </div>
          ) : null}

          <div className="pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending || !trimmedName}
              className="rounded-lg bg-[#6E8FC2] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#7A9AD0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isPending ? "Creating..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};