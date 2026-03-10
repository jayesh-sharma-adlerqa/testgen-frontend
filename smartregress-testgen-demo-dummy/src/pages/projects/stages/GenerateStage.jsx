import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "../../../api/http";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";
import { fetchFeatureDocumentsByVersion } from "../../../projectFlow/featureDocsApi";
import { useProjectFlow } from "../../../projectFlow/useProjectFlow";
import { getVersionOutputs } from "../../../api/demoBackend";

const INITIAL_GROUPS = [
  {
    id: "api",
    title: "API tests",
    enabled: true,
    cases: [
      {
        id: "api-1",
        title: "Request OTP for Login",
        priority: "High",
        steps: [
          {
            id: "api-1-step-1",
            title: "Step:1",
            content:
              "Send a request to the OTP generation endpoint with a valid email. Check the response for success status.\nVerify that an email containing a 6-digit OTP is sent to the provided email address.\n\nResult:\nAn OTP is sent to the user's email address, and the response indicates success.",
          },
          {
            id: "api-1-step-2",
            title: "Step:2",
            content:
              "Send a repeat request to ensure the endpoint still behaves consistently.\nValidate the structure of the response body and confirm expected fields are present.\n\nResult:\nThe API remains stable and returns a valid response contract.",
          },
        ],
      },
      {
        id: "api-2",
        title: "Verify OTP",
        priority: "Mid",
        steps: [
          {
            id: "api-2-step-1",
            title: "Step:1",
            content:
              "Submit a valid OTP received for the user and confirm that the verification API marks the OTP as valid.\n\nResult:\nUser verification succeeds.",
          },
        ],
      },
      {
        id: "api-3",
        title: "Request OTP for Login",
        priority: "Low",
        steps: [
          {
            id: "api-3-step-1",
            title: "Step:1",
            content:
              "Try OTP generation with a malformed email address.\n\nResult:\nAPI returns validation error.",
          },
        ],
      },
      {
        id: "api-4",
        title: "Request OTP for Login",
        priority: "Mid",
        steps: [
          {
            id: "api-4-step-1",
            title: "Step:1",
            content:
              "Validate throttling or resend behavior for repeated OTP requests.\n\nResult:\nSystem rate limiting or resend policy is respected.",
          },
        ],
      },
      {
        id: "api-5",
        title: "Request OTP for Login",
        priority: "High",
        steps: [
          {
            id: "api-5-step-1",
            title: "Step:1",
            content:
              "Check response payload and audit logging behavior when OTP request succeeds.\n\nResult:\nPayload is correct and audit trail is recorded if applicable.",
          },
        ],
      },
      {
        id: "api-6",
        title: "Request OTP for Login",
        priority: "Low",
        steps: [
          {
            id: "api-6-step-1",
            title: "Step:1",
            content:
              "Validate empty-state or null-safe behavior for optional metadata.\n\nResult:\nSystem handles optional metadata safely.",
          },
        ],
      },
      {
        id: "api-7",
        title: "Request OTP for Login",
        priority: "Low",
        steps: [
          {
            id: "api-7-step-1",
            title: "Step:1",
            content:
              "Validate success path in a clean environment and confirm event propagation.\n\nResult:\nExpected flow is completed successfully.",
          },
        ],
      },
    ],
  },
  {
    id: "e2e",
    title: "End-to-End",
    enabled: true,
    cases: [
      {
        id: "e2e-1",
        title: "Successful login journey",
        priority: "High",
        steps: [
          {
            id: "e2e-1-step-1",
            title: "Step:1",
            content:
              "Open login page, request OTP, retrieve OTP, verify OTP, and confirm redirection to dashboard.\n\nResult:\nComplete login journey succeeds.",
          },
        ],
      },
      {
        id: "e2e-2",
        title: "Expired OTP journey",
        priority: "Mid",
        steps: [
          {
            id: "e2e-2-step-1",
            title: "Step:1",
            content:
              "Use an expired OTP and ensure the flow displays proper user-facing failure.\n\nResult:\nExpired OTP is rejected with a clear message.",
          },
        ],
      },
    ],
  },
  {
    id: "ui",
    title: "UI validations",
    enabled: true,
    cases: [
      {
        id: "ui-1",
        title: "OTP input interaction states",
        priority: "Mid",
        steps: [
          {
            id: "ui-1-step-1",
            title: "Step:1",
            content:
              "Validate focus, typing, paste, and validation states for OTP input UI.\n\nResult:\nOTP UI behaves as expected.",
          },
        ],
      },
      {
        id: "ui-2",
        title: "Login error messages",
        priority: "Low",
        steps: [
          {
            id: "ui-2-step-1",
            title: "Step:1",
            content:
              "Trigger expected invalid states and verify message clarity, color, spacing, and consistency.\n\nResult:\nMessages are visible and correctly styled.",
          },
        ],
      },
    ],
  },
];

function IconSpark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2.75c.25 0 .47.16.55.4l1.52 4.48a.6.6 0 0 0 .38.38l4.48 1.52a.58.58 0 0 1 0 1.1l-4.48 1.52a.6.6 0 0 0-.38.38l-1.52 4.48a.58.58 0 0 1-1.1 0l-1.52-4.48a.6.6 0 0 0-.38-.38L5.07 10.6a.58.58 0 0 1 0-1.1l4.48-1.52a.6.6 0 0 0 .38-.38l1.52-4.48c.08-.24.3-.4.55-.4Z" />
    </svg>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 10l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEdit(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 20h4l10-10a1.8 1.8 0 0 0-4-4L4 16v4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 6.5l5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTrash(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 7h14M9 7V5.8c0-.44.36-.8.8-.8h4.4c.44 0 .8.36.8.8V7m-8.5 0 .6 10.2c.03.47.42.83.9.83h6.4c.48 0 .87-.36.9-.83L16.5 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBack(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PriorityBadge({ value }) {
  const normalized = String(value || "").toLowerCase();

  const classes =
    normalized === "high"
      ? "bg-[#2A2230] text-[#E46C7D]"
      : normalized === "mid"
        ? "bg-[#20273A] text-[#6D9BE8]"
        : "bg-[#1C2A26] text-[#41A36B]";

  return (
    <span
      className={`inline-flex min-w-[42px] justify-center rounded-[4px] px-2 py-[2px] text-[10px] ${classes}`}
    >
      {value}
    </span>
  );
}

function SectionToggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${enabled ? "bg-[#7FA4E6]" : "bg-white/10"
        }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${enabled ? "translate-x-[22px]" : "translate-x-[3px]"
          }`}
      />
    </button>
  );
}

function TestCaseRow({ item, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-[6px] px-4 py-3 text-left transition ${selected
        ? "border border-[#6078A8] bg-[#0E1524]"
        : "border border-transparent bg-[#0B1421] hover:bg-[#111A29]"
        }`}
    >
      <span className="truncate pr-4 text-[12px] text-slate-200">
        {item.title}
      </span>
      <PriorityBadge value={item.priority} />
    </button>
  );
}

function StepCard({ step, onChangeTitle, onChangeContent, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      className={`rounded-[10px] p-4 transition ${isEditing
        ? "border border-[#35507A] bg-[#0F1828] shadow-[0_0_0_1px_rgba(96,120,168,0.15)]"
        : "border border-transparent bg-[#11192B]"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <input
          value={step.title}
          readOnly={!isEditing}
          onChange={(e) => onChangeTitle(e.target.value)}
          className={`w-full rounded-[6px] border px-2 py-1 text-[12px] font-medium outline-none transition ${isEditing
            ? "border-[#2E4364] bg-[#0B1423] text-slate-100"
            : "border-transparent bg-transparent text-slate-200"
            }`}
        />

        <div className="flex items-center gap-2 text-slate-400">
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className={`rounded p-1 transition ${isEditing
              ? "bg-[#1D2C44] text-[#8BB5FF]"
              : "hover:bg-white/10 hover:text-white"
              }`}
            title={isEditing ? "Done editing" : "Edit"}
          >
            <IconEdit className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1 transition hover:bg-white/10 hover:text-white"
            title="Delete"
          >
            <IconTrash className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <textarea
        value={step.content}
        readOnly={!isEditing}
        onChange={(e) => onChangeContent(e.target.value)}
        rows={6}
        className={`mt-3 w-full resize-none rounded-[8px] border px-3 py-2 text-[11px] leading-5 outline-none transition ${isEditing
          ? "border-[#2E4364] bg-[#0B1423] text-slate-200"
          : "border-transparent bg-transparent text-slate-400"
          }`}
      />

      {isEditing ? (
        <div className="mt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-[#8BB5FF]">
          Editing
        </div>
      ) : null}
    </div>
  );
}

function PlaceholderCard({ title, subtitle }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.02] p-6">
      <div className="text-lg font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm text-slate-400">{subtitle}</div>
    </div>
  );
}

export default function GenerateStage() {
  const navigate = useNavigate();
  const { stageKey } = useProjectFlow();

  const activeProject = useProjectSessionStore((s) => s.activeProject);
  const activeFeature = useProjectSessionStore((s) => s.activeFeature);
  const activeVersion = useProjectSessionStore((s) => s.activeVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";
  const versionNumber = activeVersion?.number;

  const versionOutputs = useMemo(() => {
    if (!projectId || !featureId || !Number.isFinite(versionNumber)) return null;
    return getVersionOutputs({ projectId, featureId, versionNumber });
  }, [projectId, featureId, versionNumber]);

  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [expandedSections, setExpandedSections] = useState({
    api: true,
    e2e: false,
    ui: false,
  });
  const [selectedCaseRef, setSelectedCaseRef] = useState(null);

  const docsQuery = useQuery({
    queryKey: [
      "projects",
      projectId,
      "features",
      featureId,
      "documents-by-version",
      versionNumber,
    ],
    enabled: Boolean(projectId && featureId && Number.isFinite(versionNumber)),
    queryFn: async () => {
      return fetchFeatureDocumentsByVersion({
        projectId,
        featureId,
        versionNumber,
      });
    },
    staleTime: 5000,
  });

  const indexingStatus = docsQuery.data?.indexingStatus || null;
  const isReady = String(indexingStatus || "").toUpperCase() === "READY";

  const selectedGroup = useMemo(() => {
    if (!selectedCaseRef) return null;
    return groups.find((group) => group.id === selectedCaseRef.groupId) || null;
  }, [groups, selectedCaseRef]);

  const selectedCase = useMemo(() => {
    if (!selectedGroup || !selectedCaseRef) return null;
    return (
      selectedGroup.cases.find((item) => item.id === selectedCaseRef.caseId) ||
      null
    );
  }, [selectedGroup, selectedCaseRef]);

  function toggleSection(groupId) {
    setExpandedSections((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }

  function toggleGroupEnabled(groupId) {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, enabled: !group.enabled } : group
      )
    );
  }

  function selectCase(groupId, caseId) {
    setExpandedSections((prev) => ({ ...prev, [groupId]: true }));
    setSelectedCaseRef({ groupId, caseId });
  }

  function updateStep(stepId, key, value) {
    if (!selectedCaseRef) return;

    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== selectedCaseRef.groupId) return group;

        return {
          ...group,
          cases: group.cases.map((item) => {
            if (item.id !== selectedCaseRef.caseId) return item;

            return {
              ...item,
              steps: item.steps.map((step) =>
                step.id === stepId ? { ...step, [key]: value } : step
              ),
            };
          }),
        };
      })
    );
  }

  function deleteStep(stepId) {
    if (!selectedCaseRef) return;

    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== selectedCaseRef.groupId) return group;

        return {
          ...group,
          cases: group.cases.map((item) => {
            if (item.id !== selectedCaseRef.caseId) return item;

            return {
              ...item,
              steps: item.steps.filter((step) => step.id !== stepId),
            };
          }),
        };
      })
    );
  }

  function addStep() {
    if (!selectedCaseRef) return;

    const newId = `step-${Date.now()}`;

    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== selectedCaseRef.groupId) return group;

        return {
          ...group,
          cases: group.cases.map((item) => {
            if (item.id !== selectedCaseRef.caseId) return item;

            const nextNumber = item.steps.length + 1;

            return {
              ...item,
              steps: [
                ...item.steps,
                {
                  id: newId,
                  title: `Step:${nextNumber}`,
                  content:
                    "Write the step details here.\n\nResult:\nDescribe the expected result.",
                },
              ],
            };
          }),
        };
      })
    );
  }

  if (stageKey === "validator") {
    if (!versionOutputs?.validator) {
      return (
        <PlaceholderCard
          title="Validator"
          subtitle="Open a version from the Feature Workspace to review validator output."
        />
      );
    }

    const validator = versionOutputs.validator;

    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[#8BB5FF]">
          <button
            type="button"
            onClick={() => navigate("/projects?stage=feature-workspace")}
            className="inline-flex items-center justify-center rounded p-1 transition hover:bg-white/5"
            title="Back"
          >
            <IconBack className="h-4 w-4" />
          </button>
          <span className="text-[15px] font-medium">Validator</span>
        </div>

        <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-white">Validator Summary</div>
              <div className="mt-1 text-sm text-slate-400">
                {activeProject?.name} / {activeFeature?.name} / v{versionNumber}
              </div>
            </div>

            <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">
              Score: {validator.score ?? "—"}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <div className="rounded-[18px] border border-white/8 bg-slate-950/40 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Questions</div>
              <div className="mt-4 space-y-3">
                {(validator.questions || []).map((question, index) => (
                  <div key={`${index}-${question}`} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
                    <span className="mr-2 text-slate-500">{index + 1}.</span>
                    {question}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[18px] border border-white/8 bg-slate-950/40 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Feedback</div>
                <p className="mt-4 text-sm leading-6 text-slate-300">{validator.feedback || "No validator feedback available."}</p>
              </div>

              <div className="rounded-[18px] border border-white/8 bg-slate-950/40 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Weak areas</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(validator.weakAreas || []).map((item) => (
                    <span key={item} className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/projects?stage=edit")}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
              >
                Continue to Edit
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (stageKey === "coverage") {
    return (
      <PlaceholderCard
        title="Code Coverage"
        subtitle="We can style the Code Coverage page next in the same visual system."
      />
    );
  }

  if (!projectId || !featureId) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">Missing context</div>
        <div className="mt-2 text-sm text-slate-400">
          Please select a project and feature first.
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

  if (!Number.isFinite(versionNumber)) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-base font-semibold text-white">
          No version selected
        </div>
        <div className="mt-2 text-sm text-slate-400">
          Please choose a version first.
        </div>
        <button
          type="button"
          onClick={() => navigate("/projects?stage=feature-workspace")}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
        >
          Go to Feature Workspace
        </button>
      </div>
    );
  }

  if (docsQuery.isLoading) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-white/5" />
          <div className="h-[220px] rounded-[18px] bg-white/5" />
          <div className="h-[74px] rounded-[18px] bg-white/5" />
          <div className="h-[74px] rounded-[18px] bg-white/5" />
          <div className="h-[180px] rounded-[18px] bg-white/5" />
        </div>
      </div>
    );
  }

  if (docsQuery.isError) {
    return (
      <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-base font-semibold text-rose-100">
          Failed to load version status
        </div>
        <div className="mt-2 text-sm text-rose-200/90">
          {getErrorMessage(docsQuery.error)}
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-lg font-semibold text-white">Test Case</div>
        <div className="mt-2 text-sm text-slate-400">
          Generation is blocked until indexing becomes READY.
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-slate-200">
            Index: {indexingStatus || "UNKNOWN"}
          </span>
          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
            Disabled until READY
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/projects?stage=feature-workspace")}
          className="mt-6 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
        >
          Back to Feature Workspace
        </button>
      </div>
    );
  }

  return (
    <section className="w-full">
      <div className="mb-4 flex items-center gap-2 text-[#8BB5FF]">
        <button
          type="button"
          onClick={() => navigate("/projects?stage=feature-workspace")}
          className="inline-flex items-center justify-center rounded p-1 transition hover:bg-white/5"
          title="Back"
        >
          <IconBack className="h-4 w-4" />
        </button>
        <span className="text-[15px] font-medium">Test Case</span>
      </div>

      <div className="flex items-center gap-2 text-[#8BB5FF]">
        <IconSpark className="h-4 w-4" />
        <span className="text-[14px] font-medium">Test Case</span>
      </div>

      <div className="mt-4 space-y-3">
        {groups.map((group) => {
          const isExpanded = expandedSections[group.id];
          const isSelectedGroup = selectedCaseRef?.groupId === group.id;

          return (
            <div
              key={group.id}
              className="overflow-hidden rounded-[12px] bg-[#0B1423]"
            >
              <button
                type="button"
                onClick={() => toggleSection(group.id)}
                className="flex w-full items-center gap-2 px-4 py-4 text-left"
              >
                <IconChevron
                  className={`h-4 w-4 text-slate-400 transition ${isExpanded ? "rotate-180" : ""
                    }`}
                />
                <span className="text-[13px] text-slate-300">{group.title}</span>
              </button>

              {isExpanded ? (
                <div className="px-4 pb-4">
                  <div className="rounded-[10px] border border-[#24324A]">
                    <div className="flex items-center justify-between border-b border-[#24324A] px-4 py-3">
                      <div className="text-[22px] font-semibold text-[#8BB5FF]">
                        Covered ({group.cases.length})
                      </div>
                      <SectionToggle
                        enabled={group.enabled}
                        onToggle={() => toggleGroupEnabled(group.id)}
                      />
                    </div>

                    <div
                      className={`grid gap-0 ${selectedCase && isSelectedGroup
                        ? "grid-cols-1 lg:grid-cols-[1.1fr_0.95fr]"
                        : "grid-cols-1"
                        }`}
                    >
                      <div className="p-3">
                        <div className="space-y-1.5">
                          {group.cases.map((item) => (
                            <TestCaseRow
                              key={item.id}
                              item={item}
                              selected={
                                selectedCaseRef?.groupId === group.id &&
                                selectedCaseRef?.caseId === item.id
                              }
                              onClick={() => selectCase(group.id, item.id)}
                            />
                          ))}
                        </div>
                      </div>

                      {selectedCase && isSelectedGroup ? (
                        <div className="border-l border-[#24324A] p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[#8BB5FF]">
                              <IconSpark className="h-4 w-4" />
                              <div className="text-[13px] font-medium">
                                {selectedCase.title}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedCaseRef(null)}
                              className="rounded p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                              title="Close details"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="mt-4 space-y-4">
                            {selectedCase.steps.map((step) => (
                              <StepCard
                                key={step.id}
                                step={step}
                                onChangeTitle={(value) =>
                                  updateStep(step.id, "title", value)
                                }
                                onChangeContent={(value) =>
                                  updateStep(step.id, "content", value)
                                }
                                onDelete={() => deleteStep(step.id)}
                              />
                            ))}

                            <button
                              type="button"
                              onClick={addStep}
                              className="rounded-[8px] border border-dashed border-[#334764] px-4 py-2 text-[12px] text-slate-300 transition hover:bg-white/[0.03]"
                            >
                              + Add Step
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-2 text-[#8BB5FF]">
        <IconSpark className="h-4 w-4" />
        <span className="text-[14px] font-medium">Summary</span>
      </div>

      <div className="mt-4 rounded-[12px] bg-[#0B1423] px-5 py-5 text-[12px] leading-6 text-slate-400">
        The current code coverage stands at 70%, with 8 test cases successfully
        covered and 4 test cases missing. The covered tests include critical
        authentication flows such as OTP requests and verification processes.
        Priority should be given to implementing the missing test cases to
        achieve optimal coverage and ensure comprehensive quality assurance
        across all API endpoints.
      </div>
    </section>
  );
}