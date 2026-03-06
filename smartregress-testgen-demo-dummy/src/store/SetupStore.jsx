import { create } from "zustand";
import { http } from "../api/http";

function isConfiguredFromSetupResponse(body) {
  const candidates = [
    body?.data?.isConfigured,
    body?.isConfigured,
    body?.data?.config?.isConfigured,
    body?.config?.isConfigured,
  ];

  const configured = candidates.find((value) => typeof value === "boolean");
  return typeof configured === "boolean" ? configured : false;
}

function withConfigured(body, value) {
  const configured = Boolean(value);

  return {
    ...(body || {}),
    ...(body && Object.prototype.hasOwnProperty.call(body, "isConfigured")
      ? { isConfigured: configured }
      : {}),
    data: {
      ...(body?.data || {}),
      isConfigured: configured,
      ...(body?.data?.config || body?.config
        ? {
            config: {
              ...(body?.data?.config || body?.config || {}),
              isConfigured: configured,
            },
          }
        : {}),
    },
  };
}

let _cache = {
  token: null,
  promise: null,
  body: null,
};

export const useSetupStore = create((set, get) => ({
  status: "idle",
  isConfigured: null,
  setupBody: null,
  error: null,

  reset: () => {
    _cache = { token: null, promise: null, body: null };
    set({ status: "idle", isConfigured: null, setupBody: null, error: null });
  },

  invalidate: () => {
    _cache.body = null;
    set({ status: "idle", isConfigured: null, setupBody: null, error: null });
  },

  setConfigured: (value) => {
    const configured = Boolean(value);
    const nextBody = withConfigured(_cache.body, configured);

    _cache.body = nextBody;

    set({
      status: "ready",
      isConfigured: configured,
      setupBody: nextBody,
      error: null,
    });
  },

  ensureLoaded: async (token, { force = false } = {}) => {
    if (!token) {
      get().reset();
      return null;
    }

    if (_cache.token !== token) {
      _cache = { token, promise: null, body: null };
      set({ status: "idle", isConfigured: null, setupBody: null, error: null });
    }

    if (!force && _cache.body) {
      const configured = isConfiguredFromSetupResponse(_cache.body);
      set({
        status: "ready",
        isConfigured: configured,
        setupBody: _cache.body,
        error: null,
      });
      return configured;
    }

    if (!force && _cache.promise) return _cache.promise;

    set({ status: "loading", error: null });

    const p = http
      .get("/setup")
      .then((res) => res.data)
      .then((body) => {
        _cache.body = body;
        const configured = isConfiguredFromSetupResponse(body);

        set({
          status: "ready",
          isConfigured: configured,
          setupBody: body,
          error: null,
        });

        return configured;
      })
      .catch((err) => {
        set({
          status: "error",
          isConfigured: false,
          setupBody: null,
          error: err,
        });
        throw err;
      })
      .finally(() => {
        _cache.promise = null;
      });

    _cache.promise = p;
    return p;
  },

  refresh: async (token) => {
    return get().ensureLoaded(token, { force: true });
  },
}));