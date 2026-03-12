const STORAGE_KEY = "testgen_demo_backend_v1";
const DEMO_OTP = "123456";

let memoryState = null;

function getStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return {
    getItem() {
      return memoryState ? JSON.stringify(memoryState) : null;
    },
    setItem(_key, value) {
      memoryState = JSON.parse(value);
    },
    removeItem() {
      memoryState = null;
    },
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function base64UrlEncode(value) {
  const encoded = btoa(unescape(encodeURIComponent(String(value))));
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildToken(admin) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: admin.id,
      email: admin.email,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    })
  );

  return `${header}.${payload}.demo-signature`;
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildTestSections({ projectName, featureName, versionNumber, docs }) {
  const docTypes = docs.map((doc) => doc.docType);
  const missingInputs = [];

  if (!docTypes.includes("hld")) missingInputs.push("Architecture edge-cases from HLD are not attached yet.");
  if (!docTypes.includes("lld")) missingInputs.push("API contract examples from LLD are still pending.");
  if (!docTypes.includes("figma")) missingInputs.push("Updated UI states from Figma are not attached for this version.");

  return {
    ui: [
      `Validate happy-path flow for ${featureName} using the approved UX in ${projectName}.`,
      `Verify empty, invalid and boundary field states for ${featureName}.`,
      `Confirm breadcrumbs, stage transitions and success feedback for version v${versionNumber}.`,
    ],
    api: [
      `Verify request payload structure for ${featureName} create/update endpoints.`,
      `Validate API error handling for missing required inputs and invalid identifiers.`,
      `Confirm API response mapping supports the UI cards and detail views for v${versionNumber}.`,
    ],
    regression: [
      `Smoke-check login, setup and project navigation before opening ${featureName}.`,
      `Verify previous feature versions remain accessible after creating v${versionNumber}.`,
      `Validate export payload still includes project, feature and version metadata.`,
    ],
    missingInfo: missingInputs.length
      ? missingInputs
      : ["No major knowledge gaps detected in demo mode for this version."],
    lastGeneratedAt: nowIso(),
  };
}

function buildValidator({ featureName }) {
  return {
    score: 84,
    feedback: `${featureName} has strong core coverage but still needs more depth around edge-cases and dependency validation.`,
    weakAreas: [
      "Negative-path coverage",
      "Third-party dependency failures",
      "Cross-version compatibility",
    ],
    questions: [
      `What should happen if ${featureName} receives incomplete upstream data?`,
      `Which user role can approve or reject ${featureName} output?`,
      `What is the fallback behaviour when required integrations are unavailable?`,
    ],
    lastGeneratedAt: nowIso(),
  };
}

function buildCoverage({ featureName }) {
  return {
    overall: 78,
    weakAreas: [
      `${featureName} validation rules`,
      "Permission checks",
      "Export failure handling",
    ],
    notes: [
      "Demo coverage summary is mocked from uploaded artifacts and stage context.",
      "Line-level coverage report parsing is intentionally skipped in this client demo.",
    ],
    lastGeneratedAt: nowIso(),
  };
}

function buildVersion({ projectName, featureName, versionNumber, createdAt, documents, indexingStatus = "READY" }) {
  return {
    versionNumber,
    indexingStatus,
    createdAt,
    documents,
    outputs: {
      tests: buildTestSections({ projectName, featureName, versionNumber, docs: documents }),
      validator: buildValidator({ featureName }),
      coverage: buildCoverage({ featureName }),
    },
  };
}

function buildInitialState() {
  const now = nowIso();
  const earlier = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const bridgeCarbonVersions = [
    buildVersion({
      projectName: "BridgeCarbon – Disco Web",
      featureName: "Login Module",
      versionNumber: 1,
      createdAt: earlier,
      documents: [
        {
          id: createId("doc"),
          docType: "prd",
          displayName: "Login Module PRD.pdf",
          sourceType: "file",
          sourceValue: "login-prd.pdf",
          createdAt: earlier,
        },
        {
          id: createId("doc"),
          docType: "hld",
          displayName: "Login Module HLD.pdf",
          sourceType: "file",
          sourceValue: "login-hld.pdf",
          createdAt: earlier,
        },
        {
          id: createId("doc"),
          docType: "figma",
          displayName: "Login Flow Figma",
          sourceType: "link",
          sourceValue: "https://www.figma.com/file/demo-login-flow",
          createdAt: earlier,
        },
      ],
    }),
    buildVersion({
      projectName: "BridgeCarbon – Disco Web",
      featureName: "Login Module",
      versionNumber: 2,
      createdAt: yesterday,
      documents: [
        {
          id: createId("doc"),
          docType: "prd",
          displayName: "Login Module PRD v2.pdf",
          sourceType: "file",
          sourceValue: "login-prd-v2.pdf",
          createdAt: yesterday,
        },
        {
          id: createId("doc"),
          docType: "hld",
          displayName: "Login Module HLD v2.pdf",
          sourceType: "file",
          sourceValue: "login-hld-v2.pdf",
          createdAt: yesterday,
        },
        {
          id: createId("doc"),
          docType: "lld",
          displayName: "Login Module LLD v2.pdf",
          sourceType: "file",
          sourceValue: "login-lld-v2.pdf",
          createdAt: yesterday,
        },
        {
          id: createId("doc"),
          docType: "figma",
          displayName: "Login Flow Figma v2",
          sourceType: "link",
          sourceValue: "https://www.figma.com/file/demo-login-flow-v2",
          createdAt: yesterday,
        },
      ],
    }),
  ];

  return {
    admin: {
      id: "admin-demo",
      name: "Demo Admin",
      email: "demo@testgen.ai",
    },
    session: {
      token: null,
    },
    setup: {
      isConfigured: false,
      config: {
        llm: {
          provider: "openai",
          modelName: "gpt-4o-mini",
          apiKey: "demo-openai-key",
        },
        tokens: {
          confluenceToken: "demo-confluence-token",
          confluenceEmail: "demo@testgen.ai",
          confluenceBaseUrl: "https://adlerqatechno.atlassian.net/wiki",
          figmaToken: "demo-figma-token",
          githubPat: "demo-github-pat",
          githubRepo: "adlerqa/QA-Catalyst-AI",
        },
      },
      verification: null,
      lastUpdatedAt: now,
    },
    otp: {
      code: DEMO_OTP,
      byEmail: {},
    },
    projects: [
      {
        id: "project-bridgecarbon",
        name: "BridgeCarbon – Disco Web",
        description: "QA + TestGen automation scope",
        updatedAt: yesterday,
        features: [
          {
            id: "feature-login-module",
            name: "Login Module",
            description: "Auth + token setup feature scope",
            updatedAt: yesterday,
            versions: bridgeCarbonVersions,
          },
          {
            id: "feature-otp-journey",
            name: "OTP Journey",
            description: "Email OTP flow, verification and resend handling",
            updatedAt: now,
            versions: [],
          },
        ],
      },
      {
        id: "project-smartregress",
        name: "SmartRegress – TestGen",
        description: "Feature-based QA copilot client demo",
        updatedAt: now,
        features: [
          {
            id: "feature-upload-pipeline",
            name: "Document Upload Pipeline",
            description: "PRD/HLD/LLD/Figma ingestion and version creation",
            updatedAt: now,
            versions: [
              buildVersion({
                projectName: "SmartRegress – TestGen",
                featureName: "Document Upload Pipeline",
                versionNumber: 1,
                createdAt: now,
                documents: [
                  {
                    id: createId("doc"),
                    docType: "prd",
                    displayName: "Upload Flow PRD.pdf",
                    sourceType: "file",
                    sourceValue: "upload-flow-prd.pdf",
                    createdAt: now,
                  },
                  {
                    id: createId("doc"),
                    docType: "figma",
                    displayName: "Upload Flow Figma",
                    sourceType: "link",
                    sourceValue: "https://www.figma.com/file/demo-upload-flow",
                    createdAt: now,
                  },
                ],
              }),
            ],
          },
        ],
      },
    ],
  };
}

function loadState() {
  const storage = getStorage();
  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    const initial = buildInitialState();
    storage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const initial = buildInitialState();
    storage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function saveState(state) {
  const storage = getStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function updateState(mutator) {
  const state = loadState();
  const next = mutator(clone(state)) || state;
  return saveState(next);
}

function getProject(state, projectId) {
  return state.projects.find((project) => String(project.id) === String(projectId)) || null;
}

function getFeature(project, featureId) {
  return project?.features?.find((feature) => String(feature.id) === String(featureId)) || null;
}

function listRegistryItems(feature) {
  return (feature?.versions || []).flatMap((version) =>
    (version.documents || []).map((doc) => ({
      ...doc,
      versionNumber: version.versionNumber,
      indexingStatus: version.indexingStatus,
    }))
  );
}

function makeVerification(config) {
  const hasConfluence = Boolean(config?.tokens?.confluenceToken);
  const hasFigma = Boolean(config?.tokens?.figmaToken);
  const hasGithub = Boolean(config?.tokens?.githubPat);
  const verifiedAt = nowIso();

  return {
    llm: {
      ok: Boolean(config?.llm?.provider && config?.llm?.modelName && config?.llm?.apiKey),
      verifiedAt,
      lastError: null,
    },
    confluence: hasConfluence
      ? { ok: true, verifiedAt, lastError: null }
      : { ok: false, verifiedAt: null, lastError: "Confluence token not configured" },
    figma: hasFigma
      ? { ok: true, verifiedAt, lastError: null }
      : { ok: false, verifiedAt: null, lastError: "Figma token not configured" },
    github: hasGithub
      ? { ok: true, verifiedAt, lastError: null }
      : { ok: false, verifiedAt: null, lastError: "GitHub PAT not configured" },
  };
}

function createError(status, message) {
  const error = new Error(message);
  error.response = {
    status,
    data: {
      ok: false,
      error: {
        message,
      },
      message,
    },
  };
  return error;
}

function getDownloadFriendlyDoc(value, docType) {
  const isFile = typeof File !== "undefined" && value instanceof File;

  if (isFile) {
    return {
      id: createId("doc"),
      docType,
      displayName: value.name || `${String(docType).toUpperCase()}.pdf`,
      sourceType: "file",
      sourceValue: value.name || `${String(docType).toUpperCase()}.pdf`,
      createdAt: nowIso(),
    };
  }

  const trimmed = String(value || "").trim();
  return {
    id: createId("doc"),
    docType,
    displayName: docType === "figma" ? "Figma Design" : `${String(docType).toUpperCase()} Reference`,
    sourceType: docType === "figma" ? "link" : "text",
    sourceValue: trimmed,
    createdAt: nowIso(),
  };
}

async function delay(value) {
  return new Promise((resolve) => {
    (typeof window !== "undefined" ? window.setTimeout : globalThis.setTimeout)(() => resolve(value), 120);
  });
}

export function getDemoOtp() {
  return DEMO_OTP;
}

export function getDashboardSummary() {
  const state = loadState();
  const projects = state.projects || [];
  const features = projects.flatMap((project) => project.features || []);
  const versions = features.flatMap((feature) => feature.versions || []);

  return {
    projectCount: projects.length,
    featureCount: features.length,
    versionCount: versions.length,
    readyCount: versions.filter((version) => String(version.indexingStatus).toUpperCase() === "READY").length,
    generatedCount: versions.filter((version) => version.outputs?.tests?.lastGeneratedAt).length,
    recentVersions: versions
      .map((version) => ({
        versionNumber: version.versionNumber,
        featureName: features.find((feature) => (feature.versions || []).includes(version))?.name || "Feature",
        createdAt: version.createdAt,
        indexingStatus: version.indexingStatus,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  };
}

export function getVersionOutputs({ projectId, featureId, versionNumber }) {
  const state = loadState();
  const project = getProject(state, projectId);
  const feature = getFeature(project, featureId);
  const version = feature?.versions?.find((item) => Number(item.versionNumber) === Number(versionNumber)) || null;
  return version ? clone(version.outputs) : null;
}

export function updateVersionOutputs({ projectId, featureId, versionNumber, outputs }) {
  updateState((state) => {
    const project = getProject(state, projectId);
    const feature = getFeature(project, featureId);
    const version = feature?.versions?.find((item) => Number(item.versionNumber) === Number(versionNumber));

    if (!version) return state;

    version.outputs = clone(outputs);
    version.createdAt = version.createdAt || nowIso();
    feature.updatedAt = nowIso();
    project.updatedAt = nowIso();
    return state;
  });

  return getVersionOutputs({ projectId, featureId, versionNumber });
}

export function regenerateVersionOutputs({ projectId, featureId, versionNumber }) {
  updateState((state) => {
    const project = getProject(state, projectId);
    const feature = getFeature(project, featureId);
    const version = feature?.versions?.find((item) => Number(item.versionNumber) === Number(versionNumber));

    if (!version) return state;

    version.outputs = {
      tests: buildTestSections({
        projectName: project.name,
        featureName: feature.name,
        versionNumber,
        docs: version.documents || [],
      }),
      validator: buildValidator({ featureName: feature.name }),
      coverage: buildCoverage({ featureName: feature.name }),
    };

    feature.updatedAt = nowIso();
    project.updatedAt = nowIso();
    return state;
  });

  return getVersionOutputs({ projectId, featureId, versionNumber });
}

export async function handleDemoRequest(method, requestUrl, body) {
  const state = loadState();
  const url = new URL(requestUrl, "http://demo.local");
  const path = url.pathname;
  const searchParams = url.searchParams;
  const httpMethod = String(method || "GET").toUpperCase();

  if (httpMethod === "POST" && path === "/auth/send-otp") {
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) throw createError(400, "Valid email is required");

    updateState((draft) => {
      draft.otp.byEmail[email] = {
        code: DEMO_OTP,
        expiresAt: hoursFromNow(0.17),
        resendAvailableAt: new Date(Date.now() + 60 * 1000).toISOString(),
      };
      return draft;
    });

    return delay({
      ok: true,
      data: {
        expiresInMinutes: 10,
        resend: {
          cooldownSeconds: 60,
        },
        bootstrap: !state.admin,
      },
    });
  }

  if (httpMethod === "POST" && path === "/auth/verify-otp") {
    const email = String(body?.email || "").trim().toLowerCase();
    const otp = String(body?.otp || "").trim();
    const pending = state.otp?.byEmail?.[email];

    if (!pending) throw createError(400, "Please request an OTP first");
    if (otp !== DEMO_OTP) throw createError(400, `Invalid OTP. Use ${DEMO_OTP} in demo mode.`);

    const nextAdmin = state.admin || {
      id: createId("admin"),
      name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      email,
    };

    const token = buildToken(nextAdmin);

    updateState((draft) => {
      draft.admin = nextAdmin;
      draft.session.token = token;
      delete draft.otp.byEmail[email];
      return draft;
    });

    return delay({
      ok: true,
      data: {
        token,
        admin: nextAdmin,
      },
    });
  }

  if (httpMethod === "POST" && path === "/auth/refresh") {
    if (!state.session?.token || !state.admin) {
      throw createError(401, "No active demo session");
    }

    const token = buildToken(state.admin);
    updateState((draft) => {
      draft.session.token = token;
      return draft;
    });

    return delay({
      ok: true,
      data: {
        token,
        admin: state.admin,
      },
    });
  }

  if (httpMethod === "POST" && path === "/auth/logout") {
    updateState((draft) => {
      draft.session.token = null;
      return draft;
    });

    return delay({ ok: true, data: { success: true } });
  }

  if (httpMethod === "GET" && path === "/auth/me") {
    if (!state.admin) throw createError(401, "Not logged in");
    return delay({ ok: true, data: { admin: state.admin } });
  }

  if (httpMethod === "GET" && path === "/setup") {
    return delay({
      ok: true,
      data: {
        isConfigured: Boolean(state.setup?.isConfigured),
        config: clone(state.setup?.config || {}),
        verification: clone(state.setup?.verification || null),
      },
    });
  }

  if (httpMethod === "PUT" && path === "/setup") {
    const llm = body?.llm || {};
    if (!llm.provider || !llm.modelName || !llm.apiKey) {
      throw createError(400, "Provider, model and API key are required");
    }

    updateState((draft) => {
      draft.setup.config = clone(body);
      draft.setup.isConfigured = false;
      draft.setup.lastUpdatedAt = nowIso();
      return draft;
    });

    return delay({
      ok: true,
      data: {
        isConfigured: false,
        config: clone(body),
      },
    });
  }

  if (httpMethod === "POST" && path === "/setup/verify") {
    const verification = makeVerification(state.setup?.config || {});

    updateState((draft) => {
      draft.setup.verification = verification;
      draft.setup.isConfigured = Boolean(verification.llm?.ok);
      draft.setup.lastUpdatedAt = nowIso();
      return draft;
    });

    return delay({
      ok: true,
      data: {
        isConfigured: Boolean(verification.llm?.ok),
        verification,
      },
    });
  }

  if (httpMethod === "GET" && path === "/projects") {
    return delay({
      ok: true,
      data: {
        projects: (state.projects || []).map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          updatedAt: project.updatedAt,
          features: project.features || [],
        })),
      },
    });
  }

  if (httpMethod === "POST" && path === "/projects") {
    const name = String(body?.name || "").trim();
    if (!name) throw createError(400, "Project name is required");

    const createdProject = {
      id: createId("project"),
      name,
      description: String(body?.description || "").trim(),
      updatedAt: nowIso(),
      features: [],
    };

    updateState((draft) => {
      draft.projects.unshift(createdProject);
      return draft;
    });

    return delay({
      ok: true,
      data: {
        project: createdProject,
      },
    });
  }

  const projectMatch = path.match(/^\/projects\/([^/]+)$/);
  if (httpMethod === "GET" && projectMatch) {
    const project = getProject(state, projectMatch[1]);
    if (!project) throw createError(404, "Project not found");
    return delay({ ok: true, data: { project } });
  }

  const featuresMatch = path.match(/^\/projects\/([^/]+)\/features$/);
  if (featuresMatch) {
    const [, projectId] = featuresMatch;
    const project = getProject(state, projectId);
    if (!project) throw createError(404, "Project not found");

    if (httpMethod === "GET") {
      return delay({
        ok: true,
        data: {
          features: (project.features || []).map((feature) => ({
            id: feature.id,
            name: feature.name,
            description: feature.description,
            updatedAt: feature.updatedAt,
          })),
        },
      });
    }

    if (httpMethod === "POST") {
      const name = String(body?.name || "").trim();
      if (!name) throw createError(400, "Feature name is required");

      const createdFeature = {
        id: createId("feature"),
        name,
        description: String(body?.description || "").trim(),
        updatedAt: nowIso(),
        versions: [],
      };

      updateState((draft) => {
        const draftProject = getProject(draft, projectId);
        draftProject.features.unshift(createdFeature);
        draftProject.updatedAt = nowIso();
        return draft;
      });

      return delay({
        ok: true,
        data: {
          feature: createdFeature,
        },
      });
    }
  }

  const singleFeatureMatch = path.match(/^\/projects\/([^/]+)\/features\/([^/]+)$/);
  if (httpMethod === "GET" && singleFeatureMatch) {
    const [, projectId, featureId] = singleFeatureMatch;
    const feature = getFeature(getProject(state, projectId), featureId);
    if (!feature) throw createError(404, "Feature not found");
    return delay({ ok: true, data: { feature } });
  }

  const docsMatch = path.match(/^\/projects\/([^/]+)\/features\/([^/]+)\/documents$/);
  const docsBulkMatch = path.match(/^\/projects\/([^/]+)\/features\/([^/]+)\/documents\/bulk$/);
  if (docsMatch) {
    const [, projectId, featureId] = docsMatch;
    const project = getProject(state, projectId);
    const feature = getFeature(project, featureId);
    if (!project || !feature) throw createError(404, "Feature not found");

    if (httpMethod === "GET") {
      const versionParam = searchParams.get("versionNumber");
      const versionNumber = versionParam === null ? null : Number(versionParam);

      if (Number.isFinite(versionNumber)) {
        const version = feature.versions.find((item) => Number(item.versionNumber) === versionNumber);
        if (!version) throw createError(404, "Version not found");

        return delay({
          ok: true,
          data: {
            items: clone(version.documents || []),
            indexingStatus: version.indexingStatus,
            versionNumber: version.versionNumber,
          },
        });
      }

      const items = listRegistryItems(feature);
      const versions = (feature.versions || []).map((version) => version.versionNumber).sort((a, b) => a - b);
      const latestVersion = versions.length ? versions[versions.length - 1] : null;

      return delay({
        ok: true,
        data: {
          items,
          versionNumbers: versions,
          latestVersion,
        },
      });
    }
  }

  if (docsBulkMatch && httpMethod === "POST") {
    const [, projectId, featureId] = docsBulkMatch;
    const project = getProject(state, projectId);
    const feature = getFeature(project, featureId);
    if (!project || !feature) throw createError(404, "Feature not found");

    const versionNumber = Number(searchParams.get("versionNumber")) || 1;
    const nextDocuments = [];

    const appendIfPresent = (key, docType) => {
      const value = body?.get?.(key);
      if (value === null || value === undefined) return;
      if (!(typeof File !== "undefined" && value instanceof File) && String(value).trim() === "") return;
      nextDocuments.push(getDownloadFriendlyDoc(value, docType));
    };

    appendIfPresent("prd", "prd");
    appendIfPresent("hld", "hld");
    appendIfPresent("lld", "lld");
    appendIfPresent("figma", "figma");

    if (!nextDocuments.some((doc) => doc.docType === "prd")) {
      throw createError(400, "PRD is required to create a version");
    }

    const createdAt = nowIso();
    const version = buildVersion({
      projectName: project.name,
      featureName: feature.name,
      versionNumber,
      createdAt,
      documents: nextDocuments,
      indexingStatus: "READY",
    });

    updateState((draft) => {
      const draftProject = getProject(draft, projectId);
      const draftFeature = getFeature(draftProject, featureId);
      draftFeature.versions = (draftFeature.versions || []).filter(
        (item) => Number(item.versionNumber) !== Number(versionNumber)
      );
      draftFeature.versions.push(version);
      draftFeature.versions.sort((a, b) => a.versionNumber - b.versionNumber);
      draftFeature.updatedAt = createdAt;
      draftProject.updatedAt = createdAt;
      return draft;
    });

    return delay({
      ok: true,
      data: {
        versionNumber,
        indexingStatus: version.indexingStatus,
        items: clone(version.documents),
      },
    });
  }

  throw createError(404, `Demo route not implemented: ${httpMethod} ${path}`);
}
