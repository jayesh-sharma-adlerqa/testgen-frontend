import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http, getErrorMessage } from "../../../api/http";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";
import { fetchFeatureDocumentsRegistry } from "../../../projectFlow/featureDocsApi";

function StepBadge({ number }) {
  return (
    <div className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-white/8 bg-white/5 px-2 text-xs font-semibold text-slate-200">
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

function DocumentRow({
  step,
  label,
  placeholder,
  dashed = true,
  file,
  setFile,
  text,
  setText,
  accept = ".pdf,.doc,.docx",
}) {
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const hasText = Boolean(text?.trim());
  const hasFile = Boolean(file);
  const showClear = hasText || hasFile;

  function triggerPickFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e) {
    const picked = e.target.files?.[0] || null;
    if (picked) {
      setFile(picked);
      setText("");
    }
    e.target.value = "";
  }

  function onTextChange(e) {
    const next = e.target.value;
    setText(next);
    if (file && next.trim().length > 0) {
      setFile(null);
    }
  }

  function clearValue() {
    setFile(null);
    setText("");
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <StepBadge number={step} />
        <div className="text-sm font-semibold text-white">{label}</div>
      </div>

      <div
        className={[
          "flex min-h-[44px] items-center rounded-[10px] px-4",
          dashed
            ? "border border-dashed border-white/[0.10] bg-white/[0.02]"
            : "border border-white/10 bg-white/[0.02]",
        ].join(" ")}
      >
        {hasFile ? (
          <div className="mr-3 flex max-w-[45%] items-center gap-2 rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-200 ring-1 ring-white/10">
            <span className="truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="rounded-md p-1 text-white/80 hover:bg-white/10"
              title="Remove file"
              aria-label={`Remove file for ${label}`}
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <input
          ref={inputRef}
          value={text}
          onChange={onTextChange}
          placeholder={placeholder}
          className="w-full bg-transparent pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-500"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onFileChange}
        />

        <div className="flex items-center gap-2">
          {showClear ? (
            <button
              type="button"
              onClick={clearValue}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10"
              title="Clear"
              aria-label={`Clear ${label}`}
            >
              <IconX className="h-4 w-4" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={triggerPickFile}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2A3A5A] text-white/90 transition hover:bg-[#31466F]"
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

  const registryQuery = useQuery({
    queryKey: ["projects", projectId, "features", featureId, "docs-registry"],
    enabled: Boolean(projectId && featureId),
    queryFn: async () => fetchFeatureDocumentsRegistry({ projectId, featureId }),
    staleTime: 5_000,
  });

  const nextVersionNumber = useMemo(() => {
    const latest = Number(registryQuery.data?.latest);
    return Number.isFinite(latest) ? latest + 1 : 1;
  }, [registryQuery.data?.latest]);

  const hasPrd = useMemo(() => Boolean(prdFile) || Boolean(prdText.trim()), [prdFile, prdText]);

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

      const versionNumber = Number.isFinite(nextVersionNumber) ? nextVersionNumber : 1;

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

  const submitDisabled = !projectId || !featureId || !hasPrd || uploadMutation.isPending;

  function handleContinue() {
    setHasTriedSubmit(true);

    if (!projectId || !featureId) return;
    if (!hasPrd) return;
    if (!anyProvided) return;

    uploadMutation.mutate();
  }

  if (!projectId || !featureId) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">Project / Feature not selected</div>
        <div className="mt-2 text-sm text-slate-400">
          Please open a project and feature first (Project List → Feature List → select feature).
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
      <div className="mb-5">
        <div className="text-lg font-semibold text-white">
          {activeFeature?.name || "Feature"} — Create Version v{nextVersionNumber}
        </div>
        <div className="mt-1 text-sm text-slate-400">
          PRD is required. HLD, LLD and Figma are optional.
        </div>
      </div>

      <div className="rounded-[26px] border border-white/8 bg-white/[0.02] p-10 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <div className="space-y-6">
          <DocumentRow
            step="1"
            label="Upload PRD"
            placeholder="Paste link or upload DOC"
            dashed
            file={prdFile}
            setFile={setPrdFile}
            text={prdText}
            setText={setPrdText}
          />

          <DocumentRow
            step="2"
            label="Upload HLD"
            placeholder="Paste link or upload DOC"
            dashed
            file={hldFile}
            setFile={setHldFile}
            text={hldText}
            setText={setHldText}
          />

          <DocumentRow
            step="3"
            label="Upload LLD"
            placeholder="Paste link or upload DOC"
            dashed
            file={lldFile}
            setFile={setLldFile}
            text={lldText}
            setText={setLldText}
          />

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <StepBadge number="4" />
              <div className="text-sm font-semibold text-white">Figma Link</div>
            </div>

            <div className="flex min-h-[44px] items-center rounded-[10px] border border-white/10 bg-white/[0.02] px-4">
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
                  className="ml-2 flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10"
                  title="Clear Figma link"
                  aria-label="Clear Figma link"
                >
                  <IconX className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {hasTriedSubmit && !hasPrd ? (
            <div className="text-sm text-rose-300">Please upload PRD before creating this version.</div>
          ) : null}

          {uploadMutation.isError ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {getErrorMessage(uploadMutation.error)}
            </div>
          ) : null}

          <div className="pt-4">
            <button
              type="button"
              onClick={handleContinue}
              disabled={submitDisabled}
              className="rounded-lg bg-[#6E8FC2] px-8 py-2.5 text-sm font-medium text-white transition hover:bg-[#7A9AD0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadMutation.isPending ? "Uploading..." : `Create Version v${nextVersionNumber}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};