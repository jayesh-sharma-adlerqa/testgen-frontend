import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { http, getErrorMessage } from "../../../api/http";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";

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

function IconArrowRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

function StepBadge({ number }) {
  return (
    <div className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-white/8 bg-white/5 px-2 text-xs font-semibold text-slate-200">
      {number}
    </div>
  );
};

function normalizeCreatedProjectResponse(responseData) {
  const candidates = [
    responseData?.data?.project,
    responseData?.project,
    responseData?.data,
    responseData,
  ].filter(Boolean);

  for (const item of candidates) {
    const id = item?.id ?? item?.projectId ?? item?._id ?? null;
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

export default function CreateProjectStage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setActiveProject = useProjectSessionStore((s) => s.setActiveProject);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const trimmedDescription = useMemo(() => description.trim(), [description]);

  const nameError =
    hasTriedSubmit && !trimmedName ? "Project name is required." : "";

  const isSubmitDisabled = !trimmedName || isSubmitting;

  async function handleSubmit(event) {
    event.preventDefault();

    setHasTriedSubmit(true);
    setSubmitError("");

    if (!trimmedName) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: trimmedName,
        description: trimmedDescription,
      };

      const response = await http.post("/projects", payload);
      const createdProject = normalizeCreatedProjectResponse(response?.data);

      if (!createdProject?.id) {
        throw new Error(
          "Project was created, but project id was not returned by the API."
        );
      }

      setActiveProject({
        id: createdProject.id,
        name: createdProject.name || trimmedName,
        description: createdProject.description || trimmedDescription,
      });

      await queryClient.invalidateQueries({
        queryKey: ["projects"],
      });

      navigate("/projects?stage=feature-list");
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-slate-800/80 bg-[#091423] px-10 py-10 shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
      >
        <div className="space-y-10">
          <section>
            <div className="mb-4 flex items-center gap-3">
              <StepBadge number="1" />
              <h2 className="text-[31px] font-semibold leading-none text-white md:text-[32px]">
                Project Name
              </h2>
            </div>

            <div>
              <div
                className={[
                  "flex min-h-[56px] items-center gap-3 rounded-[14px] border bg-white/[0.04] px-4 transition",
                  nameError
                    ? "border-rose-400/70 shadow-[0_0_0_1px_rgba(251,113,133,0.15)]"
                    : "border-[#76A7FF]/80 shadow-[0_0_0_1px_rgba(118,167,255,0.10)]",
                ].join(" ")}
              >
                <IconField className="h-5 w-5 shrink-0 text-slate-500" />

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your project name"
                  autoFocus
                  aria-invalid={Boolean(nameError)}
                  className="h-full w-full border-0 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                />
              </div>

              {nameError ? (
                <p className="mt-2 text-sm text-rose-300">{nameError}</p>
              ) : null}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <StepBadge number="2" />
              <h2 className="text-[31px] font-semibold leading-none text-white md:text-[32px]">
                Description
              </h2>
            </div>

            <div className="rounded-[14px] border border-white/6 bg-white/[0.04] px-4 py-4">
              <div className="flex items-start gap-3">
                <IconDescription className="mt-1 h-5 w-5 shrink-0 text-slate-500" />

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="About your project.."
                  rows={8}
                  className="min-h-[180px] w-full resize-none border-0 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </div>
          </section>
        </div>

        {submitError ? (
          <div className="mt-8 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {submitError}
          </div>
        ) : null}

        <div className="mt-10 flex justify-center">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex min-w-[184px] items-center justify-center gap-2 rounded-xl bg-[#5F8FE8] px-6 py-3.5 text-base font-medium text-white transition hover:bg-[#6B99EE] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{isSubmitting ? "Saving..." : "Save & Continue"}</span>
            {!isSubmitting ? <IconArrowRight className="h-5 w-5" /> : null}
          </button>
        </div>
      </form>
    </div>
  );
};