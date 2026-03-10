import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "../../../api/http";
import { getVersionOutputs } from "../../../api/demoBackend";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";
import { fetchFeatureDocumentsByVersion } from "../../../projectFlow/featureDocsApi";

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
        <div key={item.label} className="flex items-center gap-3 text-sm text-slate-300">
          <span className="h-4 w-4 rounded-[4px]" style={{ backgroundColor: item.color }} />
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
          <span className="absolute left-[18px] top-[53px] text-[12px] text-white">70%</span>
          <span className="absolute right-[16px] top-[53px] text-[12px] text-white">30%</span>
        </div>

        <Legend items={COVERAGE_BREAKDOWN} />
      </div>

      <div className="mt-2 text-center text-[12px] text-[#8DB4E7]">• Code Coverage</div>
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
          <span className="absolute left-[-8px] top-[55px] text-[12px] text-white">60</span>
          <span className="absolute right-[6px] top-[12px] text-[12px] text-white">20</span>
          <span className="absolute right-[6px] bottom-[12px] text-[12px] text-white">20</span>
        </div>

        <Legend items={TEST_CASE_SPLIT} />
      </div>

      <div className="mt-2 text-center text-[12px] text-[#8DB4E7]">• Test Case</div>
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
      className={`inline-flex min-w-[52px] justify-center rounded-md border px-2 py-1 text-[10px] ${
        styles[value] || "border-white/10 bg-white/5 text-slate-300"
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
      className={`flex h-6 w-11 items-center rounded-full border px-[2px] transition ${
        isCovered ? "border-[#5277B8] bg-[#0E1723]" : "border-[#7B3340] bg-[#150E12]"
      }`}
      aria-label="Toggle covered and missing test cases"
    >
      <span
        className={`h-5 w-5 rounded-full transition ${
          isCovered
            ? "ml-auto bg-[#D6E4FF] shadow-[0_0_8px_rgba(141,180,231,0.45)]"
            : "mr-auto bg-[#B65A69] shadow-[0_0_8px_rgba(182,90,105,0.35)]"
        }`}
      />
    </button>
  );
}

function StepCard({ step }) {
  return (
    <div className="rounded-[10px] border border-[#15283F] bg-[#10161F] p-4">
      <div className="mb-3 text-sm font-medium text-slate-200">{step.title}</div>

      <div className="space-y-3 text-[12px] leading-5 text-slate-400">
        <div>{step.instruction}</div>
        <div>
          <div className="mb-1 text-[12px] font-medium text-slate-300">Result:</div>
          <div>{step.result}</div>
        </div>
      </div>
    </div>
  );
}

function TestCaseDetails({ item, onClose }) {
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
          <StepCard key={step.id} step={step} />
        ))}
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
            className={`flex w-full items-center justify-between gap-3 rounded-[6px] px-4 py-3 text-left text-[12px] transition ${
              selected
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
  const [selectedId, setSelectedId] = useState(null);

  const visibleItems = section[mode];
  const selectedItem = useMemo(
    () => visibleItems.find((item) => item.id === selectedId) || null,
    [visibleItems, selectedId]
  );

  const count = visibleItems.length;
  const isCovered = mode === "covered";

  function handleToggleMode() {
    setMode((prev) => (prev === "covered" ? "missing" : "covered"));
    setSelectedId(null);
  }

  return (
    <div className="rounded-[12px] border border-[#0E1F35] bg-[#07111F]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <ChevronIcon open={open} className="h-4 w-4 text-[#7EA5D9]" />
          <span>{section.title}</span>
        </div>
      </button>

      {open ? (
        <div className="px-4 pb-4">
          <div className="rounded-[10px] border border-[#204268] bg-[#07101C] px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div
                className={`text-[20px] font-semibold ${
                  isCovered ? "text-[#8DB4E7]" : "text-[#FF4C68]"
                }`}
              >
                {isCovered ? "Covered" : "Missing"} ({formatCount(count)})
              </div>

              <CoverageModeToggle mode={mode} onToggle={handleToggleMode} />
            </div>

            <div
              className={`mt-4 grid gap-4 ${
                selectedItem ? "grid-cols-1 xl:grid-cols-[1.2fr_0.95fr]" : "grid-cols-1"
              }`}
            >
              <div>
                <TestRows items={visibleItems} selectedId={selectedId} onSelect={setSelectedId} />
              </div>

              {selectedItem ? (
                <TestCaseDetails item={selectedItem} onClose={() => setSelectedId(null)} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CoverageResultView({ summaryText }) {
  return (
    <div className="space-y-5">
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
          {summaryText}
        </div>
      </div>
    </div>
  );
}

export default function CoverageStage() {
  const navigate = useNavigate();

  const activeProject = useProjectSessionStore((state) => state.activeProject);
  const activeFeature = useProjectSessionStore((state) => state.activeFeature);
  const activeVersion = useProjectSessionStore((state) => state.activeVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";
  const versionNumber = activeVersion?.number;

  const docsQuery = useQuery({
    queryKey: ["projects", projectId, "features", featureId, "documents-by-version", versionNumber],
    enabled: Boolean(projectId && featureId && Number.isFinite(versionNumber)),
    queryFn: async () =>
      fetchFeatureDocumentsByVersion({
        projectId,
        featureId,
        versionNumber,
      }),
    staleTime: 5_000,
  });

  const coverage = useMemo(() => {
    if (!projectId || !featureId || !Number.isFinite(versionNumber)) return null;
    return getVersionOutputs({ projectId, featureId, versionNumber })?.coverage || null;
  }, [projectId, featureId, versionNumber]);

  const summaryText =
    Array.isArray(coverage?.notes) && coverage.notes.length
      ? coverage.notes.join(" ")
      : "The current code coverage stands at 70%, with 8 test cases successfully covered and 4 test cases missing. The covered tests include critical authentication flows such as OTP requests and verification processes. Priority should be given to implementing the missing test cases to achieve optimal coverage and ensure comprehensive quality assurance across all API endpoints.";

  if (!projectId || !featureId) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-lg font-semibold text-white">Code Coverage</div>
        <div className="mt-2 text-sm text-slate-400">Please select a project and feature first.</div>
      </div>
    );
  }

  if (!Number.isFinite(versionNumber)) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-lg font-semibold text-white">Code Coverage</div>
        <div className="mt-2 text-sm text-slate-400">Please choose a version first.</div>
      </div>
    );
  }

  if (docsQuery.isLoading) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-white/5" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="h-[220px] rounded-[20px] bg-white/5" />
            <div className="h-[220px] rounded-[20px] bg-white/5" />
          </div>
          <div className="h-[320px] rounded-[20px] bg-white/5" />
          <div className="h-[140px] rounded-[20px] bg-white/5" />
        </div>
      </div>
    );
  }

  if (docsQuery.isError) {
    return (
      <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-base font-semibold text-rose-100">Failed to load coverage context</div>
        <div className="mt-2 text-sm text-rose-200/90">{getErrorMessage(docsQuery.error)}</div>
      </div>
    );
  }

  return (
    <section className="w-full text-white">
      <div className="mb-5 flex items-center gap-2 text-[#8BB5FF]">
        <button
          type="button"
          onClick={() => navigate("/projects?stage=feature-workspace")}
          className="inline-flex items-center justify-center rounded p-1 transition hover:bg-white/5"
          title="Back"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-[15px] font-medium">Code Coverage</span>
      </div>

      <CoverageResultView summaryText={summaryText} />
    </section>
  );
};