import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";

const COVERAGE_BREAKDOWN = [
  { label: "API Test", value: 70, color: "#4B3FAE" },
  { label: "Pull Request", value: 30, color: "#8DB4E7" },
];

const TEST_CASE_SPLIT = [
  { label: "API Test", value: 60, color: "#4B3FAE" },
  { label: "UI Validation", value: 20, color: "#89A9DC" },
  { label: "End-to-End", value: 20, color: "#39A87B" },
];

const INITIAL_SECTIONS = {
  api: {
    key: "api",
    title: "API tests",
    covered: [
      {
        id: "api-covered-1",
        name: "Request OTP for Login",
        priority: "High",
        steps: [
          {
            id: "api-covered-1-step-1",
            title: "Step:1",
            instruction:
              "Send a request to the OTP generation endpoint with a valid email. Check the response for success status. Verify that an email containing a 6-digit OTP is sent to the provided email address.",
            result:
              "An OTP is sent to the user's email address, and the response indicates success.",
          },
          {
            id: "api-covered-1-step-2",
            title: "Step:2",
            instruction:
              "Send a request to the OTP generation endpoint again with a valid email and confirm duplicate request handling remains successful.",
            result:
              "The request succeeds and the user receives a valid OTP again without breaking the flow.",
          },
        ],
      },
      {
        id: "api-covered-2",
        name: "Verify OTP",
        priority: "Mid",
        steps: [
          {
            id: "api-covered-2-step-1",
            title: "Step:1",
            instruction:
              "Submit a valid OTP along with the user's email to the verification endpoint.",
            result:
              "The response returns success and the user session/token is created.",
          },
        ],
      },
      {
        id: "api-covered-3",
        name: "Request OTP for Login",
        priority: "Low",
        steps: [
          {
            id: "api-covered-3-step-1",
            title: "Step:1",
            instruction:
              "Trigger OTP request using a valid user email and inspect the response contract.",
            result:
              "The API responds with a success state and OTP dispatch confirmation.",
          },
        ],
      },
      {
        id: "api-covered-4",
        name: "Request OTP for Login",
        priority: "Mid",
        steps: [
          {
            id: "api-covered-4-step-1",
            title: "Step:1",
            instruction:
              "Retry OTP generation after a previous valid request and verify the flow still works.",
            result:
              "OTP generation remains successful and stable.",
          },
        ],
      },
      {
        id: "api-covered-5",
        name: "Request OTP for Login",
        priority: "High",
        steps: [
          {
            id: "api-covered-5-step-1",
            title: "Step:1",
            instruction:
              "Request OTP using a login identifier mapped to an active account.",
            result:
              "The OTP is generated and sent successfully.",
          },
        ],
      },
      {
        id: "api-covered-6",
        name: "Request OTP for Login",
        priority: "Low",
        steps: [
          {
            id: "api-covered-6-step-1",
            title: "Step:1",
            instruction:
              "Observe response payload structure when OTP request succeeds.",
            result:
              "All required success fields are returned correctly.",
          },
        ],
      },
      {
        id: "api-covered-7",
        name: "Request OTP for login",
        priority: "Low",
        steps: [
          {
            id: "api-covered-7-step-1",
            title: "Step:1",
            instruction:
              "Validate OTP generation flow for another valid account profile.",
            result:
              "The API responds successfully and sends OTP as expected.",
          },
        ],
      },
    ],
    missing: [
      {
        id: "api-missing-1",
        name: "Request OTP for Login",
        priority: "High",
        steps: [
          {
            id: "api-missing-1-step-1",
            title: "Step:1",
            instruction:
              "Validate behavior when OTP request is attempted for an expired or blocked account state.",
            result:
              "The API should return an error response with correct messaging.",
          },
        ],
      },
      {
        id: "api-missing-2",
        name: "Verify OTP",
        priority: "Mid",
        steps: [
          {
            id: "api-missing-2-step-1",
            title: "Step:1",
            instruction:
              "Submit invalid OTP values repeatedly and verify lockout or validation feedback.",
            result:
              "The API should reject invalid attempts and return the expected validation response.",
          },
        ],
      },
      {
        id: "api-missing-3",
        name: "Request OTP for Login",
        priority: "Low",
        steps: [
          {
            id: "api-missing-3-step-1",
            title: "Step:1",
            instruction:
              "Attempt OTP generation with malformed input and validate failure behavior.",
            result:
              "The endpoint should reject malformed input with clear validation output.",
          },
        ],
      },
      {
        id: "api-missing-4",
        name: "Request OTP for Login",
        priority: "Mid",
        steps: [
          {
            id: "api-missing-4-step-1",
            title: "Step:1",
            instruction:
              "Verify token/session coupling after OTP success for a less common auth path.",
            result:
              "The system should preserve valid auth/session behavior.",
          },
        ],
      },
    ],
  },
  e2e: {
    key: "e2e",
    title: "End-to-End",
    covered: [
      {
        id: "e2e-covered-1",
        name: "Login → project select → compare PR",
        priority: "High",
        steps: [
          {
            id: "e2e-covered-1-step-1",
            title: "Step:1",
            instruction:
              "Login with OTP, select a project, navigate to version detail, and run comparison.",
            result:
              "The complete end-to-end flow works and coverage output is shown.",
          },
        ],
      },
      {
        id: "e2e-covered-2",
        name: "Navigate to version detail after compare",
        priority: "Mid",
        steps: [
          {
            id: "e2e-covered-2-step-1",
            title: "Step:1",
            instruction:
              "Use the back action from coverage output and confirm correct navigation.",
            result:
              "The app returns to version detail without losing context.",
          },
        ],
      },
      {
        id: "e2e-covered-3",
        name: "Export selected coverage results",
        priority: "Low",
        steps: [
          {
            id: "e2e-covered-3-step-1",
            title: "Step:1",
            instruction:
              "From the downstream flow, export generated content after comparison.",
            result:
              "The export completes successfully with expected output.",
          },
        ],
      },
    ],
    missing: [
      {
        id: "e2e-missing-1",
        name: "Multiple PR compare with mixed modules",
        priority: "High",
        steps: [
          {
            id: "e2e-missing-1-step-1",
            title: "Step:1",
            instruction:
              "Compare multiple PRs affecting different modules and validate aggregated coverage.",
            result:
              "The UI should merge impact and render combined coverage insights correctly.",
          },
        ],
      },
      {
        id: "e2e-missing-2",
        name: "Large PR comparison timeout recovery",
        priority: "Mid",
        steps: [
          {
            id: "e2e-missing-2-step-1",
            title: "Step:1",
            instruction:
              "Simulate a slow compare run and validate the recovery UX.",
            result:
              "The system should recover gracefully and guide the user clearly.",
          },
        ],
      },
    ],
  },
  ui: {
    key: "ui",
    title: "UI validations",
    covered: [
      {
        id: "ui-covered-1",
        name: "Paste link input validation",
        priority: "Mid",
        steps: [
          {
            id: "ui-covered-1-step-1",
            title: "Step:1",
            instruction:
              "Enter invalid and valid PR URLs and verify input and CTA behavior.",
            result:
              "The UI blocks invalid submission and allows valid inputs.",
          },
        ],
      },
      {
        id: "ui-covered-2",
        name: "Loading state visibility",
        priority: "Low",
        steps: [
          {
            id: "ui-covered-2-step-1",
            title: "Step:1",
            instruction:
              "Run compare and validate loading view visibility throughout processing.",
            result:
              "The loading state remains visible until coverage results appear.",
          },
        ],
      },
      {
        id: "ui-covered-3",
        name: "Accordion open/close interaction",
        priority: "Low",
        steps: [
          {
            id: "ui-covered-3-step-1",
            title: "Step:1",
            instruction:
              "Open and close each accordion block and verify the layout remains stable.",
            result:
              "Accordion behavior works correctly across sections.",
          },
        ],
      },
    ],
    missing: [
      {
        id: "ui-missing-1",
        name: "Empty state for no matching PR changes",
        priority: "Mid",
        steps: [
          {
            id: "ui-missing-1-step-1",
            title: "Step:1",
            instruction:
              "Compare a PR with no mapped impact and validate no-result handling.",
            result:
              "The UI should show a meaningful empty state with guidance.",
          },
        ],
      },
      {
        id: "ui-missing-2",
        name: "Duplicate PR link validation",
        priority: "Low",
        steps: [
          {
            id: "ui-missing-2-step-1",
            title: "Step:1",
            instruction:
              "Paste duplicate PR links and verify inline duplicate validation.",
            result:
              "The UI should flag duplicates before comparison starts.",
          },
        ],
      },
    ],
  },
};

function ArrowLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14.75 6.75 9.5 12l5.25 5.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10.5 13.5 13.5 10.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8.25 15.75H7.5a3.25 3.25 0 1 1 0-6.5h3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M15.75 8.25h.75a3.25 3.25 0 1 1 0 6.5h-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CompareIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 7h8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8 17h8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="m10 5-2 2 2 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m14 15 2 2-2 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ open, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d={open ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3.75 13.9 8.1 18.25 10 13.9 11.9 12 16.25 10.1 11.9 5.75 10 10.1 8.1 12 3.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PencilIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 20h4l9.8-9.8a1.75 1.75 0 0 0 0-2.47l-1.53-1.53a1.75 1.75 0 0 0-2.47 0L4 16v4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m12.5 7.5 4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 7h14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9 7V5.75A1.75 1.75 0 0 1 10.75 4h2.5A1.75 1.75 0 0 1 15 5.75V7"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 10v6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 10v6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M16 10v6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M6.5 7 7 18.25A1.75 1.75 0 0 0 8.75 20h6.5A1.75 1.75 0 0 0 17 18.25L17.5 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 5v14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m7 7 10 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M17 7 7 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildConicGradient(parts) {
  let cursor = 0;
  const stops = parts.map((part) => {
    const start = cursor;
    cursor += part.value;
    return `${part.color} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

function formatCount(count) {
  return String(count).padStart(2, "0");
}

function Legend({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 text-sm text-slate-300"
        >
          <span
            className="h-4 w-4 rounded-[4px]"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function PieCard() {
  return (
    <div className="rounded-[20px] border border-[#0F2643] bg-[#07111F] px-8 py-6 shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between gap-6">
        <div
          className="relative mx-auto h-[118px] w-[118px] shrink-0 rounded-full"
          style={{ background: buildConicGradient(COVERAGE_BREAKDOWN) }}
        >
          <span className="absolute left-[18px] top-[53px] text-[12px] text-white">
            70%
          </span>
          <span className="absolute right-[16px] top-[53px] text-[12px] text-white">
            30%
          </span>
        </div>

        <Legend items={COVERAGE_BREAKDOWN} />
      </div>

      <div className="mt-2 text-center text-[12px] text-[#8DB4E7]">
        • Code Coverage
      </div>
    </div>
  );
}

function DonutCard() {
  return (
    <div className="rounded-[20px] border border-[#0F2643] bg-[#07111F] px-8 py-6 shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between gap-6">
        <div
          className="relative mx-auto h-[118px] w-[118px] shrink-0 rounded-full"
          style={{ background: buildConicGradient(TEST_CASE_SPLIT) }}
        >
          <div className="absolute inset-[17px] grid place-items-center rounded-full bg-[#08101C] text-center">
            <div className="text-[14px] font-semibold text-white">Test Case</div>
          </div>
          <span className="absolute left-[-8px] top-[55px] text-[12px] text-white">
            60
          </span>
          <span className="absolute right-[6px] top-[12px] text-[12px] text-white">
            20
          </span>
          <span className="absolute right-[6px] bottom-[12px] text-[12px] text-white">
            20
          </span>
        </div>

        <Legend items={TEST_CASE_SPLIT} />
      </div>

      <div className="mt-2 text-center text-[12px] text-[#8DB4E7]">
        • Test Case
      </div>
    </div>
  );
}

function PriorityBadge({ value }) {
  const styles = {
    High: "border-rose-500/20 bg-rose-500/10 text-rose-300",
    Mid: "border-blue-400/20 bg-blue-400/10 text-blue-300",
    Low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  };

  return (
    <span
      className={`inline-flex min-w-[52px] justify-center rounded-md border px-2 py-1 text-[10px] ${styles[value] || "border-white/10 bg-white/5 text-slate-300"
        }`}
    >
      {value}
    </span>
  );
}

function CoverageModeToggle({ mode, onToggle }) {
  const isCovered = mode === "covered";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex h-6 w-11 items-center rounded-full border px-[2px] transition ${isCovered
          ? "border-[#5277B8] bg-[#0E1723]"
          : "border-[#7B3340] bg-[#150E12]"
        }`}
      aria-label="Toggle covered and missing test cases"
    >
      <span
        className={`h-5 w-5 rounded-full transition ${isCovered
            ? "ml-auto bg-[#D6E4FF] shadow-[0_0_8px_rgba(141,180,231,0.45)]"
            : "mr-auto bg-[#B65A69] shadow-[0_0_8px_rgba(182,90,105,0.35)]"
          }`}
      />
    </button>
  );
}

function StepCard({ step, onSave, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: step.title,
    instruction: step.instruction,
    result: step.result,
  });

  useEffect(() => {
    setDraft({
      title: step.title,
      instruction: step.instruction,
      result: step.result,
    });
  }, [step.id, step.title, step.instruction, step.result]);

  function handleSave() {
    onSave({
      ...step,
      title: draft.title,
      instruction: draft.instruction,
      result: draft.result,
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setDraft({
      title: step.title,
      instruction: step.instruction,
      result: step.result,
    });
    setIsEditing(false);
  }

  return (
    <div className="rounded-[10px] border border-[#15283F] bg-[#10161F] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        {isEditing ? (
          <input
            value={draft.title}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, title: event.target.value }))
            }
            className="w-full rounded-md border border-[#294B75] bg-[#08111D] px-2 py-1 text-sm text-white outline-none"
          />
        ) : (
          <div className="text-sm font-medium text-slate-200">{step.title}</div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className="grid h-6 w-6 place-items-center rounded-md border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
            title="Edit step"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="grid h-6 w-6 place-items-center rounded-md border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
            title="Delete step"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <>
          <div className="mb-3">
            <div className="mb-2 text-[12px] text-slate-400">Action</div>
            <textarea
              value={draft.instruction}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  instruction: event.target.value,
                }))
              }
              className="min-h-[94px] w-full resize-none rounded-[8px] border border-[#1A314E] bg-[#08111D] px-3 py-2 text-[12px] leading-5 text-slate-200 outline-none"
            />
          </div>

          <div>
            <div className="mb-2 text-[12px] text-slate-400">Result</div>
            <textarea
              value={draft.result}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, result: event.target.value }))
              }
              className="min-h-[78px] w-full resize-none rounded-[8px] border border-[#1A314E] bg-[#08111D] px-3 py-2 text-[12px] leading-5 text-slate-200 outline-none"
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-[8px] bg-[#89A9DC] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#95B4E5]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-[8px] border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-3 text-[12px] leading-5 text-slate-400">
          <div>{step.instruction}</div>
          <div>
            <div className="mb-1 text-[12px] font-medium text-slate-300">
              Result:
            </div>
            <div>{step.result}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function TestCaseDetails({ item, onClose, onStepSave, onStepDelete, onAddStep }) {
  if (!item) return null;

  return (
    <div className="rounded-[10px] border border-[#203B5E] bg-[#08111D] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-[#A7C9F6]">
            <SparkleIcon className="h-3.5 w-3.5" />
            <span className="truncate">{item.name}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {item.steps.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            onSave={(updatedStep) => onStepSave(step.id, updatedStep)}
            onDelete={() => onStepDelete(step.id)}
          />
        ))}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onAddStep}
          className="inline-flex items-center gap-2 rounded-[8px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
        >
          <PlusIcon className="h-4 w-4" />
          Add step
        </button>
      </div>
    </div>
  );
}

function TestRows({ items, selectedId, onSelect }) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const selected = item.id === selectedId;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex w-full items-center justify-between gap-3 rounded-[6px] px-4 py-3 text-left text-[12px] transition ${selected
                ? "border border-[#365C88] bg-[#101A29] text-white"
                : "border border-transparent bg-[#0B1523] text-slate-200 hover:border-[#213B5C]"
              }`}
          >
            <span className="truncate">{item.name}</span>
            <PriorityBadge value={item.priority} />
          </button>
        );
      })}
    </div>
  );
}

function AccordionSection({ section, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [mode, setMode] = useState("covered");
  const [localSection, setLocalSection] = useState(section);
  const [selectedId, setSelectedId] = useState(null);

  const visibleItems = localSection[mode];
  const selectedItem = useMemo(
    () => visibleItems.find((item) => item.id === selectedId) || null,
    [visibleItems, selectedId]
  );

  useEffect(() => {
    if (!visibleItems.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [visibleItems, selectedId]);

  function handleToggleMode() {
    setMode((prev) => (prev === "covered" ? "missing" : "covered"));
    setSelectedId(null);
  }

  function updateSelectedItem(transformer) {
    if (!selectedId) return;

    setLocalSection((prev) => ({
      ...prev,
      [mode]: prev[mode].map((item) =>
        item.id === selectedId ? transformer(item) : item
      ),
    }));
  }

  function handleStepSave(stepId, updatedStep) {
    updateSelectedItem((item) => ({
      ...item,
      steps: item.steps.map((step) => (step.id === stepId ? updatedStep : step)),
    }));
  }

  function handleStepDelete(stepId) {
    updateSelectedItem((item) => {
      const nextSteps = item.steps.filter((step) => step.id !== stepId);

      return {
        ...item,
        steps:
          nextSteps.length > 0
            ? nextSteps
            : [
              {
                id: `${item.id}-step-fallback`,
                title: "Step:1",
                instruction: "",
                result: "",
              },
            ],
      };
    });
  }

  function handleAddStep() {
    updateSelectedItem((item) => {
      const nextIndex = item.steps.length + 1;
      return {
        ...item,
        steps: [
          ...item.steps,
          {
            id: `${item.id}-step-${Date.now()}`,
            title: `Step:${nextIndex}`,
            instruction: "",
            result: "",
          },
        ],
      };
    });
  }

  const count = visibleItems.length;
  const isCovered = mode === "covered";

  return (
    <div className="rounded-[12px] border border-[#0E1F35] bg-[#07111F]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <ChevronIcon open={open} className="h-4 w-4 text-[#7EA5D9]" />
          <span>{localSection.title}</span>
        </div>
      </button>

      {open ? (
        <div className="px-4 pb-4">
          <div className="rounded-[10px] border border-[#204268] bg-[#07101C] px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div
                className={`text-[20px] font-semibold ${isCovered ? "text-[#8DB4E7]" : "text-[#FF4C68]"
                  }`}
              >
                {isCovered ? "Covered" : "Missing"} ({formatCount(count)})
              </div>

              <CoverageModeToggle mode={mode} onToggle={handleToggleMode} />
            </div>

            <div
              className={`mt-4 grid gap-4 ${selectedItem
                  ? "grid-cols-1 xl:grid-cols-[1.2fr_0.95fr]"
                  : "grid-cols-1"
                }`}
            >
              <div>
                <TestRows
                  items={visibleItems}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>

              {selectedItem ? (
                <TestCaseDetails
                  item={selectedItem}
                  onClose={() => setSelectedId(null)}
                  onStepSave={handleStepSave}
                  onStepDelete={handleStepDelete}
                  onAddStep={handleAddStep}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InputState({
  prLinks,
  onChangeLink,
  onAddLink,
  onRemoveLink,
  onCompare,
  disabled,
}) {
  return (
    <div className="mx-auto w-full max-w-[860px] rounded-[26px] border border-[#09182B] bg-[#05101C] px-9 py-8 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="text-lg font-medium text-white">Pull Requests</div>

      <div className="mt-4 space-y-3">
        {prLinks.map((link, index) => (
          <div key={`pr-link-${index}`} className="flex items-center gap-3">
            <div className="flex flex-1 items-center rounded-[10px] border border-[#294B75] bg-[#141D2A] px-4 py-3">
              <input
                value={link}
                onChange={(event) => onChangeLink(index, event.target.value)}
                placeholder="Paste PR link"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
              <LinkIcon className="h-4 w-4 text-[#718AB1]" />
            </div>

            {prLinks.length > 1 ? (
              <button
                type="button"
                onClick={() => onRemoveLink(index)}
                className="grid h-[46px] w-[46px] place-items-center rounded-[10px] border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
                title="Remove PR"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onAddLink}
          className="inline-flex items-center gap-2 rounded-[8px] border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:bg-white/10"
        >
          <PlusIcon className="h-4 w-4" />
          Add another PR
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onCompare}
          className="rounded-[8px] bg-[#89A9DC] px-6 py-2.5 text-base font-medium text-white transition hover:bg-[#95B4E5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Compare
        </button>
      </div>
    </div>
  );
}

function LoadingState({ prCount }) {
  return (
    <div className="mx-auto flex max-w-[820px] flex-col items-center">
      <div className="flex w-full items-center justify-center gap-5">
        <div className="h-[140px] w-[272px] rounded-[12px] border border-[#294B75] bg-[#08131F] px-8 py-7 shadow-[0_12px_35px_rgba(0,0,0,0.22)]">
          <div className="text-[18px] font-semibold text-[#8DB4E7]">
            Test Case
          </div>
        </div>

        <div className="grid h-10 w-10 place-items-center rounded-full border border-[#294B75] bg-[#08131F] text-[#8DB4E7]">
          <CompareIcon className="h-5 w-5" />
        </div>

        <div className="h-[140px] w-[272px] rounded-[12px] border border-[#294B75] bg-[#08131F] px-8 py-7 shadow-[0_12px_35px_rgba(0,0,0,0.22)]">
          <div className="text-[18px] font-semibold text-[#8DB4E7]">
            Pull Request{prCount > 1 ? "s" : ""}
          </div>
          <div className="mt-8 text-sm text-slate-400">
            {prCount} input{prCount > 1 ? "s" : ""} selected
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <div className="text-lg text-white">Comparing test Coverage</div>
        <div className="mt-2 text-sm text-slate-500">Please Wait...</div>
      </div>
    </div>
  );
}

function ResultState({ comparedPrLinks }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border border-[#0E1F35] bg-[#07111F] px-4 py-4">
        <div className="text-sm font-medium text-white">Compared Pull Requests</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {comparedPrLinks.map((link, index) => (
            <span
              key={`${link}-${index}`}
              className="rounded-full border border-[#22456E] bg-[#091423] px-3 py-1.5 text-xs text-slate-300"
            >
              {link}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PieCard />
        <DonutCard />
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2 text-lg font-medium text-[#A5C5F0]">
          <SparkleIcon className="h-4 w-4" />
          <span>Test Case</span>
        </div>

        <div className="space-y-3">
          <AccordionSection section={INITIAL_SECTIONS.api} defaultOpen />
          <AccordionSection section={INITIAL_SECTIONS.e2e} />
          <AccordionSection section={INITIAL_SECTIONS.ui} />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2 text-lg font-medium text-[#A5C5F0]">
          <SparkleIcon className="h-4 w-4" />
          <span>Summary</span>
        </div>

        <div className="rounded-[14px] border border-[#0E1F35] bg-[#07111F] px-5 py-4 text-sm leading-7 text-slate-400">
          The current code coverage stands at 70%, with 8 test cases
          successfully covered and 4 test cases missing. The covered tests
          include critical authentication flows such as OTP requests and
          verification processes. Priority should be given to implementing the
          missing test cases to achieve optimal coverage and ensure
          comprehensive quality assurance across all API endpoints.
        </div>
      </div>
    </div>
  );
}

export function CoverageExperience({ standalone = false }) {
  const navigate = useNavigate();
  const activeProject = useProjectSessionStore((state) => state.activeProject);
  const activeFeature = useProjectSessionStore((state) => state.activeFeature);
  const activeVersion = useProjectSessionStore((state) => state.activeVersion);

  const [prLinks, setPrLinks] = useState([
    "https://github.com/smartregress/testgen/pull/248",
  ]);
  const [comparedPrLinks, setComparedPrLinks] = useState([]);
  const [step, setStep] = useState("input");
  const timerRef = useRef(null);

  const subtitle = useMemo(() => {
    const projectName = activeProject?.name || "Customer Portal";
    const featureName = activeFeature?.name || "Authentication";
    const versionLabel = Number.isFinite(activeVersion?.number)
      ? `v${activeVersion.number}`
      : "v2";

    return `${projectName} / ${featureName} / ${versionLabel}`;
  }, [activeProject, activeFeature, activeVersion]);

  const validPrLinks = useMemo(
    () => prLinks.map((value) => value.trim()).filter(Boolean),
    [prLinks]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChangeLink(index, value) {
    setPrLinks((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  }

  function handleAddLink() {
    setPrLinks((prev) => [...prev, ""]);
  }

  function handleRemoveLink(index) {
    setPrLinks((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length ? next : [""];
    });
  }

  function handleCompare() {
    if (!validPrLinks.length) return;

    setComparedPrLinks(validPrLinks);
    setStep("loading");

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStep("result");
    }, 1800);
  }

  return (
    <section className="w-full text-white">
      {!standalone ? (
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {subtitle}
          </div>

          {step === "result" ? (
            <button
              type="button"
              onClick={() => navigate("/projects?stage=version-detail")}
              className="inline-flex items-center gap-2 rounded-[8px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Feature Details
            </button>
          ) : null}
        </div>
      ) : null}

      {step === "input" ? (
        <div className="pt-20">
          <InputState
            prLinks={prLinks}
            onChangeLink={handleChangeLink}
            onAddLink={handleAddLink}
            onRemoveLink={handleRemoveLink}
            onCompare={handleCompare}
            disabled={!validPrLinks.length}
          />
        </div>
      ) : null}

      {step === "loading" ? (
        <div className="pt-16">
          <LoadingState prCount={comparedPrLinks.length || validPrLinks.length} />
        </div>
      ) : null}

      {step === "result" ? (
        <div className="space-y-6">
          <ResultState comparedPrLinks={comparedPrLinks} />
        </div>
      ) : null}
    </section>
  );
}

export default function CoverageStage() {
  return <CoverageExperience />;
};