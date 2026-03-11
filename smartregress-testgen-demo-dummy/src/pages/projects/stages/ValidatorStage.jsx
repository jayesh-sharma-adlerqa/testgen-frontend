import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "../../../api/http";
import { useProjectSessionStore } from "../../../store/ProjectSessionStore";
import { fetchFeatureDocumentsByVersion } from "../../../projectFlow/featureDocsApi";

const VALIDATOR_QUESTIONS = [
  {
    id: "q1",
    question: "Which test case is most critical for an OTP-based login flow?",
    hint: "Pick the most essential user journey.",
    options: [
      { key: "a", label: "Checking page title on login screen" },
      { key: "b", label: "Successful OTP request and login completion" },
      { key: "c", label: "Changing theme color after login" },
      { key: "d", label: "Opening profile settings without authentication" },
    ],
    correctKey: "b",
  },
  {
    id: "q2",
    question: "Which of these is a valid negative test for OTP verification?",
    hint: "Look for a failure scenario.",
    options: [
      { key: "a", label: "Submitting a valid OTP within expiry time" },
      { key: "b", label: "Redirecting to dashboard after valid login" },
      { key: "c", label: "Submitting an expired OTP" },
      { key: "d", label: "Displaying welcome message after success" },
    ],
    correctKey: "c",
  },
  {
    id: "q3",
    question: "What should be validated in a successful OTP generation API response?",
    hint: "Think about response correctness.",
    options: [
      { key: "a", label: "Only response time" },
      { key: "b", label: "Status code, success flag, and expected payload fields" },
      { key: "c", label: "Only UI button color" },
      { key: "d", label: "Only backend logs" },
    ],
    correctKey: "b",
  },
  {
    id: "q4",
    question: "Which scenario best represents input validation coverage?",
    hint: "Pick the case focused on bad user input.",
    options: [
      { key: "a", label: "OTP resend after success" },
      { key: "b", label: "Entering malformed email or empty input" },
      { key: "c", label: "Viewing dashboard widgets" },
      { key: "d", label: "Downloading reports after login" },
    ],
    correctKey: "b",
  },
  {
    id: "q5",
    question: "Why should test cases include expected results?",
    hint: "This is about execution clarity.",
    options: [
      { key: "a", label: "To make test cases longer" },
      { key: "b", label: "To reduce the number of test cases" },
      { key: "c", label: "To help execution and validation stay unambiguous" },
      { key: "d", label: "To replace API documentation" },
    ],
    correctKey: "c",
  },
  {
    id: "q6",
    question: "Which test best covers session-handling after successful authentication?",
    hint: "Think beyond OTP verification itself.",
    options: [
      { key: "a", label: "User can access protected screen after login" },
      { key: "b", label: "OTP input accepts only numbers" },
      { key: "c", label: "Login page loads in dark mode" },
      { key: "d", label: "Tooltip appears on hover" },
    ],
    correctKey: "a",
  },
  {
    id: "q7",
    question: "Which is the best example of a UI validation test?",
    hint: "Focus on client-side behavior.",
    options: [
      { key: "a", label: "API returns 200 on OTP request" },
      { key: "b", label: "Database saves auth token" },
      { key: "c", label: "OTP field shows error state for invalid input" },
      { key: "d", label: "Server retries failed mail dispatch" },
    ],
    correctKey: "c",
  },
  {
    id: "q8",
    question: "What is the purpose of end-to-end test coverage in this flow?",
    hint: "Think full user journey.",
    options: [
      { key: "a", label: "To test only the API in isolation" },
      { key: "b", label: "To validate the complete login journey across screens and systems" },
      { key: "c", label: "To replace unit tests entirely" },
      { key: "d", label: "To check only static text content" },
    ],
    correctKey: "b",
  },
  {
    id: "q9",
    question: "Which missing test is most important from a risk perspective?",
    hint: "Pick the highest-impact failure case.",
    options: [
      { key: "a", label: "Changing footer alignment" },
      { key: "b", label: "Successful login repetition" },
      { key: "c", label: "Invalid or expired OTP handling" },
      { key: "d", label: "Tooltip hover animation" },
    ],
    correctKey: "c",
  },
  {
    id: "q10",
    question: "How should generated test cases ideally be prioritized?",
    hint: "Think execution value.",
    options: [
      { key: "a", label: "Randomly" },
      { key: "b", label: "By screen color and layout" },
      { key: "c", label: "By business risk and critical user flows" },
      { key: "d", label: "Only by number of steps" },
    ],
    correctKey: "c",
  },
  {
    id: "q11",
    question: "Which case best represents a boundary or edge test?",
    hint: "Think uncommon but realistic limit scenario.",
    options: [
      { key: "a", label: "Using OTP exactly near expiry time" },
      { key: "b", label: "Clicking login after a successful session" },
      { key: "c", label: "Reading dashboard greeting text" },
      { key: "d", label: "Opening navigation menu" },
    ],
    correctKey: "a",
  },
  {
    id: "q12",
    question: "What makes a generated test case execution-ready?",
    hint: "Focus on usability for QA.",
    options: [
      { key: "a", label: "It has many steps but no expected result" },
      { key: "b", label: "It has clear steps, data context, and expected outcomes" },
      { key: "c", label: "It is only one sentence long" },
      { key: "d", label: "It mentions only the module name" },
    ],
    correctKey: "b",
  },
  {
    id: "q13",
    question: "Which coverage gap is related to user recovery flow?",
    hint: "Recovery means the user can continue after a problem.",
    options: [
      { key: "a", label: "Resend OTP after expiry" },
      { key: "b", label: "Open dashboard after login" },
      { key: "c", label: "Display feature title" },
      { key: "d", label: "Expand accordion section" },
    ],
    correctKey: "a",
  },
  {
    id: "q14",
    question: "Why is response contract validation important in API test cases?",
    hint: "Think about backend change detection.",
    options: [
      { key: "a", label: "It only improves UI styling" },
      { key: "b", label: "It helps detect breaking changes in structure and fields" },
      { key: "c", label: "It removes the need for functional tests" },
      { key: "d", label: "It is only needed for frontend tests" },
    ],
    correctKey: "b",
  },
  {
    id: "q15",
    question: "If all happy-path tests exist but failure-path tests are missing, the suite is:",
    hint: "Think balance of coverage.",
    options: [
      { key: "a", label: "Complete" },
      { key: "b", label: "Over-documented" },
      { key: "c", label: "Partially covered" },
      { key: "d", label: "Automation-ready by default" },
    ],
    correctKey: "c",
  },
];

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

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m5 12.5 4.2 4.2L19 7.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProgressBar({ current, total, answered }) {
  const percent = Math.max(0, Math.min(100, (answered / total) * 100));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>
          Question {current + 1} of {total}
        </span>
        <span>{answered}/{total} answered</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-[#3B68BF] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function OptionCard({ option, active, onClick, optionIndex }) {
  const optionLabel = ["A", "B", "C", "D"][optionIndex] || "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[16px] border px-4 py-4 text-left transition ${
        active
          ? "border-[#4B74B8] bg-[#0F1A2A] text-white shadow-[0_0_0_1px_rgba(75,116,184,0.15)]"
          : "border-[#0E1F35] bg-[#07111F] text-slate-200 hover:border-[#27476F] hover:bg-[#0A1523]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
            active
              ? "border-[#6E97D6] bg-[#173155] text-[#CFE0FF]"
              : "border-white/10 bg-white/[0.03] text-slate-300"
          }`}
        >
          {optionLabel}
        </div>

        <div className="flex-1">
          <div className="text-sm leading-6">{option.label}</div>
        </div>

        <div
          className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
            active ? "border-[#6E97D6] bg-[#173155] text-[#CFE0FF]" : "border-white/10"
          }`}
        >
          {active ? <CheckIcon className="h-3.5 w-3.5" /> : null}
        </div>
      </div>
    </button>
  );
}

function ScoreRing({ score }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const degrees = (safeScore / 100) * 360;

  return (
    <div
      className="relative h-[140px] w-[140px] rounded-full"
      style={{
        background: `conic-gradient(#3B68BF 0deg ${degrees}deg, rgba(255,255,255,0.08) ${degrees}deg 360deg)`,
      }}
    >
      <div className="absolute inset-[12px] grid place-items-center rounded-full bg-[#08111D]">
        <div className="text-center">
          <div className="text-3xl font-semibold text-white">{safeScore}%</div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">Score</div>
        </div>
      </div>
    </div>
  );
}

function getScoreMeta(score) {
  if (score >= 85) {
    return {
      label: "Excellent",
      tone: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
      message: "Strong validation understanding across the generated test-case set.",
    };
  }

  if (score >= 65) {
    return {
      label: "Good",
      tone: "border-blue-400/20 bg-blue-500/10 text-blue-200",
      message: "Good understanding, but some validation areas can still improve.",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Improvement",
      tone: "border-amber-400/20 bg-amber-500/10 text-amber-200",
      message: "Several important validation concepts are still missing or inconsistent.",
    };
  }

  return {
    label: "Weak",
    tone: "border-rose-400/20 bg-rose-500/10 text-rose-200",
    message: "Validation quality needs major improvement before relying on this set.",
    };
}

function ReviewRow({ item, selectedKey }) {
  const selectedOption = item.options.find((opt) => opt.key === selectedKey);
  const correctOption = item.options.find((opt) => opt.key === item.correctKey);
  const isCorrect = selectedKey === item.correctKey;

  return (
    <div className="rounded-[14px] border border-[#0E1F35] bg-[#07111F] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="pr-3">
          <div className="text-sm font-medium text-white">{item.question}</div>
        </div>

        <div
          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full ${
            isCorrect
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-rose-500/10 text-rose-300"
          }`}
        >
          {isCorrect ? <CheckIcon className="h-4 w-4" /> : <CrossIcon className="h-4 w-4" />}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-[10px] border border-white/8 bg-white/[0.03] px-3 py-2">
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Your Answer</div>
          <div className="mt-1 text-sm text-slate-200">{selectedOption?.label || "Not answered"}</div>
        </div>

        <div className="rounded-[10px] border border-white/8 bg-white/[0.03] px-3 py-2">
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Correct Answer</div>
          <div className="mt-1 text-sm text-slate-200">{correctOption?.label}</div>
        </div>
      </div>
    </div>
  );
}

export default function ValidatorStage() {
  const navigate = useNavigate();

  const activeProject = useProjectSessionStore((state) => state.activeProject);
  const activeFeature = useProjectSessionStore((state) => state.activeFeature);
  const activeVersion = useProjectSessionStore((state) => state.activeVersion);

  const projectId = activeProject?.id || "";
  const featureId = activeFeature?.id || "";
  const versionNumber = activeVersion?.number;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    setCurrentIndex(0);
    setAnswers({});
  }, [projectId, featureId, versionNumber]);

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

  const totalQuestions = VALIDATOR_QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const isFinished = answeredCount === totalQuestions;

  const currentQuestion = VALIDATOR_QUESTIONS[currentIndex];
  const selectedAnswerKey = currentQuestion ? answers[currentQuestion.id] : null;

  const result = useMemo(() => {
    const correctCount = VALIDATOR_QUESTIONS.filter(
      (item) => answers[item.id] === item.correctKey
    ).length;

    const wrongCount = totalQuestions - correctCount;
    const score = Math.round((correctCount / totalQuestions) * 100);

    return {
      correctCount,
      wrongCount,
      score,
    };
  }, [answers, totalQuestions]);

  const scoreMeta = useMemo(() => getScoreMeta(result.score), [result.score]);

  function selectAnswer(answerKey) {
    if (!currentQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answerKey,
    }));
  }

  function goNext() {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function goPrevious() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }

  function restartValidator() {
    setCurrentIndex(0);
    setAnswers({});
  }

  if (!projectId || !featureId) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-lg font-semibold text-white">Validator</div>
        <div className="mt-2 text-sm text-slate-400">Please select a project and feature first.</div>
      </div>
    );
  }

  if (!Number.isFinite(versionNumber)) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="text-lg font-semibold text-white">Validator</div>
        <div className="mt-2 text-sm text-slate-400">Please choose a version first.</div>
      </div>
    );
  }

  if (docsQuery.isLoading) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-white/5" />
          <div className="h-[220px] rounded-[18px] bg-white/5" />
          <div className="h-[220px] rounded-[18px] bg-white/5" />
        </div>
      </div>
    );
  }

  if (docsQuery.isError) {
    return (
      <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-base font-semibold text-rose-100">Failed to load validator context</div>
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
        <span className="text-[15px] font-medium">Validator</span>
      </div>

      {!isFinished ? (
        <div className="space-y-5">
          <div className="rounded-[20px] border border-[#0F2643] bg-[#07111F] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[#A7C9F6]">
                  <SparkleIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">MCQ Validator</span>
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  {activeProject?.name} / {activeFeature?.name} / v{versionNumber}
                </div>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                {answeredCount} / {totalQuestions} completed
              </div>
            </div>

            <div className="mt-5">
              <ProgressBar current={currentIndex} total={totalQuestions} answered={answeredCount} />
            </div>
          </div>

          <div className="rounded-[20px] border border-[#0F2643] bg-[#07111F] p-6 shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Question {currentIndex + 1}
              </div>
              <h2 className="mt-3 text-2xl font-semibold leading-9 text-white">
                {currentQuestion.question}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                {currentQuestion.hint}
              </p>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <OptionCard
                  key={option.key}
                  option={option}
                  optionIndex={index}
                  active={selectedAnswerKey === option.key}
                  onClick={() => selectAnswer(option.key)}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={goPrevious}
                disabled={currentIndex === 0}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={restartValidator}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
                >
                  Reset
                </button>

                {currentIndex === totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!selectedAnswerKey}
                    className="rounded-xl bg-[#3B68BF] px-5 py-2 text-sm text-white transition hover:bg-[#4674CF] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Finish
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!selectedAnswerKey}
                    className="rounded-xl bg-[#3B68BF] px-5 py-2 text-sm text-white transition hover:bg-[#4674CF] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-[20px] border border-[#0F2643] bg-[#07111F] p-6 shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="flex flex-col items-center justify-center rounded-[18px] border border-[#0E1F35] bg-[#08111D] p-6">
                <ScoreRing score={result.score} />

                <div className={`mt-5 rounded-full border px-3 py-1 text-xs ${scoreMeta.tone}`}>
                  {scoreMeta.label}
                </div>

                <p className="mt-4 text-center text-sm leading-7 text-slate-400">
                  {scoreMeta.message}
                </p>
              </div>

              <div className="rounded-[18px] border border-[#0E1F35] bg-[#08111D] p-5">
                <div className="flex items-center gap-2 text-[#A7C9F6]">
                  <SparkleIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Result Summary</span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[14px] border border-emerald-400/15 bg-emerald-500/10 px-4 py-4">
                    <div className="text-2xl font-semibold text-emerald-200">{result.correctCount}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-emerald-300/80">
                      Correct
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-rose-400/15 bg-rose-500/10 px-4 py-4">
                    <div className="text-2xl font-semibold text-rose-200">{result.wrongCount}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-rose-300/80">
                      Wrong
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-blue-400/15 bg-blue-500/10 px-4 py-4">
                    <div className="text-2xl font-semibold text-blue-200">{totalQuestions}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-blue-300/80">
                      Total
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[14px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-slate-400">
                  The validator score is based on 15 MCQ answers. This is currently a themed in-app validation view and can later be connected to your actual generated test-case intelligence flow.
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={restartValidator}
                    className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
                  >
                    Retake Validator
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/projects?stage=feature-workspace")}
                    className="rounded-xl bg-[#3B68BF] px-4 py-2 text-sm text-white transition hover:bg-[#4674CF]"
                  >
                    Back to Feature Workspace
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#0F2643] bg-[#07111F] p-6 shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
            <div className="mb-4 flex items-center gap-2 text-[#A7C9F6]">
              <SparkleIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Answer Review</span>
            </div>

            <div className="space-y-3">
              {VALIDATOR_QUESTIONS.map((item) => (
                <ReviewRow key={item.id} item={item} selectedKey={answers[item.id]} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};