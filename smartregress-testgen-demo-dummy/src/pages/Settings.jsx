import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { http, getErrorMessage } from "../api/http";
import { useSetupStore } from "../store/SetupStore";

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "claude", label: "Claude" },
  { value: "gemini", label: "Gemini" },
];

const MODELS_BY_PROVIDER = {
  openai: [
    { value: "gpt-4o-mini", label: "gpt-4o-mini" },
    { value: "gpt-4o", label: "gpt-4o" },
  ],
  claude: [
    { value: "claude-3-5-sonnet", label: "claude-3-5-sonnet" },
    { value: "claude-3-5-haiku", label: "claude-3-5-haiku" },
  ],
  gemini: [
    { value: "gemini-1.5-pro", label: "gemini-1.5-pro" },
    { value: "gemini-1.5-flash", label: "gemini-1.5-flash" },
  ],
};

function NumberBadge({ n }) {
  return (
    <div className="mt-1 grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-slate-200">
      {n}
    </div>
  );
}

function Label({ children }) {
  return <div className="text-sm font-semibold text-slate-200">{children}</div>;
}

function Help({ children }) {
  return <div className="mt-1 text-xs text-slate-400">{children}</div>;
}

function TextInput({ value, onChange, placeholder, disabled, type = "text" }) {
  return (
    <input
      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      type={type}
    />
  );
}

function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <select
      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-slate-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SecretInput({ value, onChange, placeholder, disabled, errorText }) {
  const [show, setShow] = useState(false);

  return (
    <div className="mt-2">
      <div className="relative">
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-20 text-sm text-slate-100 outline-none transition focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          type={show ? "text" : "password"}
          autoComplete="off"
        />

        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-60"
          disabled={disabled}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>

      {errorText ? (
        <div className="mt-2 text-xs text-red-200">{errorText}</div>
      ) : null}
    </div>
  );
}

function pickVerification(body) {
  return body?.data?.verification || body?.verification || null;
}

function listVerifyFailures(verification, enabled) {
  if (!verification) return [];

  const items = [
    { key: "llm", label: "LLM", always: true },
    { key: "confluence", label: "Confluence", always: false },
    { key: "figma", label: "Figma", always: false },
    { key: "github", label: "GitHub", always: false },
  ];

  return items
    .map((it) => {
      const v = verification[it.key];
      if (!v) return null;

      if (!it.always && !enabled?.[it.key]) return null;

      if (v.ok === true) return null;

      return {
        key: it.key,
        label: it.label,
        message: v.lastError || "Invalid / could not verify",
      };
    })
    .filter(Boolean);
}

export default function Settings() {
  const navigate = useNavigate();
  const setConfigured = useSetupStore((s) => s.setConfigured);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [provider, setProvider] = useState("");
  const [modelName, setModelName] = useState("");
  const [apiKey, setApiKey] = useState("");

  const [confluenceToken, setConfluenceToken] = useState("");
  const [confluenceEmail, setConfluenceEmail] = useState("");
  const [confluenceBaseUrl, setConfluenceBaseUrl] = useState("");

  const [figmaToken, setFigmaToken] = useState("");

  const [githubPat, setGithubPat] = useState("");
  const [githubRepo, setGithubRepo] = useState("");

  const [verification, setVerification] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const modelOptions = useMemo(() => {
    return MODELS_BY_PROVIDER[provider] || [];
  }, [provider]);

  const isLlmComplete = useMemo(() => {
    return Boolean(provider && modelName && apiKey.trim());
  }, [provider, modelName, apiKey]);

  useEffect(() => {
    if (!provider) {
      setModelName("");
      return;
    }

    const options = MODELS_BY_PROVIDER[provider] || [];
    const exists = options.some((o) => o.value === modelName);

    if (!exists) {
      setModelName("");
    }
  }, [provider, modelName]);

  async function loadSetup() {
    setLoading(true);
    setFieldErrors({});

    try {
      const body = (await http.get("/setup?includeSecrets=true")).data;
      const d = body?.data || {};

      const llm = d?.config?.llm || {};
      const tokens = d?.config?.tokens || {};

      const p = llm?.provider || "openai";
      setProvider(p);

      const defaultModel = MODELS_BY_PROVIDER[p]?.[0]?.value || "gpt-4o-mini";
      setModelName(llm?.modelName || defaultModel);

      setApiKey(llm?.apiKey || "");

      setConfluenceToken(tokens?.confluenceToken || "");
      setConfluenceEmail(tokens?.confluenceEmail || "");
      setConfluenceBaseUrl(tokens?.confluenceBaseUrl || "");

      setFigmaToken(tokens?.figmaToken || "");

      setGithubPat(tokens?.githubPat || "");
      setGithubRepo(tokens?.githubRepo || "");

      setVerification(d?.verification || null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSetup();
  }, []);

  function buildPayloadOrThrow() {
    const errors = {};

    if (!provider) errors.provider = "Select provider";
    if (!modelName) errors.modelName = "Select model";
    if (!apiKey.trim()) errors.apiKey = "LLM API key is required";

    const hasConfluenceToken = Boolean(confluenceToken.trim());
    if (hasConfluenceToken) {
      if (!confluenceEmail.trim()) errors.confluenceEmail = "Confluence email required";
      if (!confluenceBaseUrl.trim()) errors.confluenceBaseUrl = "Confluence base URL required";
    }

    const hasGithubRepo = Boolean(githubRepo.trim());
    if (hasGithubRepo && !githubPat.trim()) {
      errors.githubPat = "GitHub PAT is required when GitHub Repo is provided";
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      const first = Object.values(errors)[0];
      throw new Error(first);
    }

    const payload = {
      llm: {
        provider,
        modelName,
        apiKey: apiKey.trim(),
      },
      tokens: {
        ...(confluenceToken.trim() ? { confluenceToken: confluenceToken.trim() } : {}),
        ...(confluenceEmail.trim() ? { confluenceEmail: confluenceEmail.trim() } : {}),
        ...(confluenceBaseUrl.trim() ? { confluenceBaseUrl: confluenceBaseUrl.trim() } : {}),

        ...(figmaToken.trim() ? { figmaToken: figmaToken.trim() } : {}),

        ...(githubPat.trim() ? { githubPat: githubPat.trim() } : {}),
        ...(githubRepo.trim() ? { githubRepo: githubRepo.trim() } : {}),
      },
    };

    return payload;
  }

  async function onSaveAndContinue() {
    if (saving) return;
    if (!isLlmComplete) return;

    setSaving(true);
    setFieldErrors({});

    try {
      const payload = buildPayloadOrThrow();

      const putBody = (await http.put("/setup", payload)).data;
      if (!putBody?.ok) {
        throw new Error(putBody?.error?.message || "Failed to save setup");
      }
      toast.success("Setup saved. Verifying...");

      const verifyBody = (await http.post("/setup/verify")).data;
      if (!verifyBody?.ok) {
        throw new Error(verifyBody?.error?.message || "Setup verification failed");
      }

      const ver = pickVerification(verifyBody) || null;
      setVerification(ver);

      const enabled = {
        confluence: Boolean(confluenceToken.trim()),
        figma: Boolean(figmaToken.trim()),
        github: Boolean(githubPat.trim()),
      };

      const failures = listVerifyFailures(ver, enabled);

      if (failures.length) {
        const nextFieldErrors = {};
        for (const f of failures) {
          toast.error(`${f.label} verification failed: ${f.message}`);
          if (f.key === "llm") nextFieldErrors.apiKey = f.message;
          if (f.key === "confluence") nextFieldErrors.confluenceToken = f.message;
          if (f.key === "figma") nextFieldErrors.figmaToken = f.message;
          if (f.key === "github") nextFieldErrors.githubPat = f.message;
        }
        setFieldErrors((prev) => ({ ...prev, ...nextFieldErrors }));
        return;
      }

      toast.success("Setup verified successfully!");
      setConfigured(true);
      await loadSetup();
      navigate("/dashboard", { replace: true, state: { setupJustCompleted: true } });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          Demo mode: this screen stores configuration locally and always verifies against mocked integrations.
        </div>
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-[28px_1fr] gap-4">
            <NumberBadge n={1} />
            <div>
              <Label>LLM Provider</Label>
              <Select
                value={provider}
                onChange={(v) => setProvider(v)}
                options={PROVIDERS}
                placeholder="Select your Provider"
                disabled={loading || saving}
              />
              {fieldErrors.provider ? (
                <div className="mt-2 text-xs text-red-200">{fieldErrors.provider}</div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-[28px_1fr] gap-4">
            <NumberBadge n={2} />
            <div>
              <Label>LLM Model</Label>
              <Select
                value={modelName}
                onChange={(v) => setModelName(v)}
                options={modelOptions}
                placeholder="Select your Model"
                disabled={loading || saving || !provider}
              />
              {fieldErrors.modelName ? (
                <div className="mt-2 text-xs text-red-200">{fieldErrors.modelName}</div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-[28px_1fr] gap-4">
            <NumberBadge n={3} />
            <div>
              <Label>API Key</Label>
              <SecretInput
                value={apiKey}
                onChange={setApiKey}
                placeholder="Enter API key"
                disabled={loading || saving}
                errorText={fieldErrors.apiKey}
              />
              <Help>Required. This is used for test generation & analysis.</Help>
            </div>
          </div>

          <div className="grid grid-cols-[28px_1fr] gap-4">
            <NumberBadge n={4} />
            <div>
              <Label>Confluence Token</Label>
              <SecretInput
                value={confluenceToken}
                onChange={setConfluenceToken}
                placeholder="Enter confluence token (optional)"
                disabled={loading || saving}
                errorText={fieldErrors.confluenceToken}
              />
              <Help>If you provide Confluence token, Email + Base URL become mandatory.</Help>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-slate-300">Confluence Email</div>
                  <TextInput
                    value={confluenceEmail}
                    onChange={setConfluenceEmail}
                    placeholder="Enter Confluence Email"
                    disabled={loading || saving}
                  />
                  {fieldErrors.confluenceEmail ? (
                    <div className="mt-2 text-xs text-red-200">{fieldErrors.confluenceEmail}</div>
                  ) : null}
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-300">Confluence Base URL</div>
                  <TextInput
                    value={confluenceBaseUrl}
                    onChange={setConfluenceBaseUrl}
                    placeholder="https://your-domain.atlassian.net/wiki"
                    disabled={loading || saving}
                  />
                  {fieldErrors.confluenceBaseUrl ? (
                    <div className="mt-2 text-xs text-red-200">{fieldErrors.confluenceBaseUrl}</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[28px_1fr] gap-4">
            <NumberBadge n={5} />
            <div>
              <Label>Figma Token</Label>
              <SecretInput
                value={figmaToken}
                onChange={setFigmaToken}
                placeholder="Enter Figma token (optional)"
                disabled={loading || saving}
                errorText={fieldErrors.figmaToken}
              />
              <Help>Optional. Used for parsing Figma designs.</Help>
            </div>
          </div>

          <div className="grid grid-cols-[28px_1fr] gap-4">
            <NumberBadge n={6} />
            <div>
              <Label>GitHub PAT</Label>
              <SecretInput
                value={githubPat}
                onChange={setGithubPat}
                placeholder="Enter GitHub PAT (optional)"
                disabled={loading || saving}
                errorText={fieldErrors.githubPat}
              />
              <Help>Optional. Required only when GitHub Repo is provided.</Help>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-300">GitHub Repo</div>
                <TextInput
                  value={githubRepo}
                  onChange={setGithubRepo}
                  placeholder="adlerqa/QA-Catalyst-AI"
                  disabled={loading || saving}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onSaveAndContinue}
              disabled={loading || saving || !isLlmComplete}
              className="mx-auto block rounded-xl bg-slate-200/25 px-10 py-3 text-sm font-semibold text-slate-100 ring-1 ring-white/10 transition hover:bg-slate-200/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save & Continue"}
            </button>

            {verification?.llm?.verifiedAt || verification?.confluence?.verifiedAt ? (
              <div className="mt-4 text-center text-xs text-slate-400">
                Last verified:{" "}
                <span className="text-slate-200">
                  {new Date(
                    verification?.llm?.verifiedAt ||
                    verification?.confluence?.verifiedAt
                  ).toLocaleString()}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};