// src/pages/projects/stages/UploadDocumentsStage.jsx
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http, getErrorMessage } from "../../../api/http";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";
import {
  fetchFeatureDocumentsRegistry,
  deriveVersionsFromRegistry,
} from "../../../projectFlow/featureDocsApi";

function StepBadge({ number }) {
  return (
    <div className="inline-flex h-6 min-w-6 items-center justify-center rounded-[7px] bg-[#111B2F] px-2 text-[11px] font-medium text-slate-300">
      {number}
    </div>
  );
}

function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconX(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFile(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14.25 3.75H7.5A1.75 1.75 0 0 0 5.75 5.5v13A1.75 1.75 0 0 0 7.5 20.25h9A1.75 1.75 0 0 0 18.25 18.5V7.75l-4-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 3.75V7.5h3.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadField({
  step,
  label,
  placeholder,
  file,
  setFile,
  text,
  setText,
  accept = ".pdf,.doc,.docx",
  dashed = true,
}) {
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  const hasFile = Boolean(file);
  const hasText = Boolean(text?.trim());
  const hasValue = hasFile || hasText;

  function triggerFilePick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const picked = e.target.files?.[0] || null;
    if (picked) {
      setFile(picked);
      setText("");
    }
    e.target.value = "";
  }

  function handleTextChange(e) {
    const next = e.target.value;
    setText(next);
    if (file && next.trim()) {
      setFile(null);
    }
  }

  function clearValue() {
    setFile(null);
    setText("");
    textInputRef.current?.focus();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <StepBadge number={step} />
        <div className="text-[15px] font-medium text-white">{label}</div>
      </div>

      <div
        className={[
          "flex min-h-[42px] items-center rounded-[10px] px-3",
          dashed
            ? "border border-dashed border-[#3B4B68] bg-[#121B2C]/70"
            : "border border-[#31415D] bg-[#1A2334]",
        ].join(" ")}
      >
        {hasFile ? (
          <div className="mr-3 flex max-w-[48%] items-center gap-2 rounded-[8px] border border-[#6078A8] bg-[#20293B] px-3 py-1.5 text-xs text-slate-200">
            <IconFile className="h-4 w-4 shrink-0 text-slate-300" />
            <span className="truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="ml-1 rounded p-0.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              title="Remove file"
              aria-label={`Remove file for ${label}`}
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <input
          ref={textInputRef}
          value={text}
          onChange={handleTextChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="ml-3 flex items-center gap-2">
          {hasValue ? (
            <button
              type="button"
              onClick={clearValue}
              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-slate-300 transition hover:bg-white/10 hover:text-white"
              title={`Clear ${label}`}
              aria-label={`Clear ${label}`}
            >
              <IconX className="h-4 w-4" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={triggerFilePick}
            className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#24345B] text-[#9DB5E7] transition hover:bg-[#2C416F] hover:text-white"
            title={hasFile ? "Replace file" : "Upload file"}
            aria-label={`Upload ${label}`}
          >
            <IconPlus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UploadDocumentsStage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeProject = useProjectSessionStore((s) => s.activeProject);
  const activeFeature = useProjectSessionStore((s) => s.activeFeature);
  const setActiveVersion = useProjectSessionStore((s) => s.setActiveVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";

  const [prdFile, setPrdFile] = useState(null);
  const [prdText, setPrdText] = useState("");

  const [hldFile, setHldFile] = useState(null);
  const [hldText, setHldText] = useState("");

  const [lldFile, setLldFile] = useState(null);
  const [lldText, setLldText] = useState("");

  const [figma, setFigma] = useState("");
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  // Only one field required: PRD or HLD or LLD or Figma
  const anyProvided = useMemo(() => {
    return (
      Boolean(prdFile) ||
      Boolean(prdText.trim()) ||
      Boolean(hldFile) ||
      Boolean(hldText.trim()) ||
      Boolean(lldFile) ||
      Boolean(lldText.trim()) ||
      Boolean(figma.trim())
    );
  }, [prdFile, prdText, hldFile, hldText, lldFile, lldText, figma]);

  const submitDisabled = !projectId || !featureId || !anyProvided;

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();

      if (prdFile) fd.append("prd", prdFile);
      else if (prdText.trim()) fd.append("prd", prdText.trim());

      if (hldFile) fd.append("hld", hldFile);
      else if (hldText.trim()) fd.append("hld", hldText.trim());

      if (lldFile) fd.append("lld", lldFile);
      else if (lldText.trim()) fd.append("lld", lldText.trim());

      if (figma.trim()) fd.append("figma", figma.trim());

      let versionNumber = 1;

      try {
        const registryItems = await fetchFeatureDocumentsRegistry({ projectId, featureId });
        const { latest } = deriveVersionsFromRegistry(registryItems);
        versionNumber = Number.isFinite(latest) ? latest + 1 : 1;
      } catch {
        versionNumber = 1;
      }

      const res = await http.post(
        `/projects/${projectId}/features/${featureId}/documents/bulk?versionNumber=${encodeURIComponent(
          String(versionNumber)
        )}`,
        fd
      );

      return { data: res?.data, versionNumber };
    },

    onSuccess: async ({ versionNumber }) => {
      await queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "features"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "features", featureId, "docs-registry"],
      });

      setActiveVersion(versionNumber);
      navigate("/projects?stage=version-detail");
    },
  });

  function handleContinue() {
    setHasTriedSubmit(true);

    if (!projectId || !featureId) return;
    if (!anyProvided) return;

    uploadMutation.mutate();
  }

  if (!projectId || !featureId) {
    return (
      <div className="rounded-[18px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">
          Project / Feature not selected
        </div>
        <div className="mt-2 text-sm text-slate-400">
          Please open a project and feature first.
        </div>

        <button
          type="button"
          onClick={() => navigate("/projects?stage=project-list")}
          className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
        >
          Go to Project List
        </button>
      </div>
    );
  }

  return (
    <section className="w-full">
      <div className="rounded-[18px] border border-[#111A2C] bg-[#081221] px-6 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
        <div className="rounded-[16px] border border-[#0E1626] bg-[#0B1423] px-6 py-7">
          <div className="space-y-7">
            <UploadField
              step="1"
              label="Upload PRD"
              placeholder="Paste link or upload DOC"
              file={prdFile}
              setFile={setPrdFile}
              text={prdText}
              setText={setPrdText}
              dashed
            />

            <UploadField
              step="2"
              label="Upload HLD"
              placeholder="Paste link or upload DOC"
              file={hldFile}
              setFile={setHldFile}
              text={hldText}
              setText={setHldText}
              dashed
            />

            <UploadField
              step="3"
              label="Upload LLD"
              placeholder="Paste link or upload DOC"
              file={lldFile}
              setFile={setLldFile}
              text={lldText}
              setText={setLldText}
              dashed
            />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge number="4" />
                <div className="text-[15px] font-medium text-white">Figma Link</div>
              </div>

              <div className="flex min-h-[42px] items-center rounded-[10px] border border-[#31415D] bg-[#1A2334] px-3">
                <input
                  value={figma}
                  onChange={(e) => setFigma(e.target.value)}
                  placeholder="Paste link"
                  className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                />

                {figma.trim() ? (
                  <button
                    type="button"
                    onClick={() => setFigma("")}
                    className="ml-3 flex h-7 w-7 items-center justify-center rounded-[8px] text-slate-300 transition hover:bg-white/10 hover:text-white"
                    title="Clear Figma link"
                    aria-label="Clear Figma link"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            {hasTriedSubmit && !anyProvided ? (
              <div className="rounded-[10px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                Please provide at least one item: PRD, HLD, LLD, or Figma link.
              </div>
            ) : null}

            {uploadMutation.isError ? (
              <div className="rounded-[10px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {getErrorMessage(uploadMutation.error)}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={handleContinue}
          disabled={submitDisabled || uploadMutation.isPending}
          className="rounded-[8px] bg-[#8AA8D9] px-8 py-2.5 text-sm font-medium text-white transition hover:bg-[#97B4E2] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploadMutation.isPending ? "Uploading..." : "Continue"}
        </button>
      </div>
    </section>
  );
};