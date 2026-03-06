import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage";
import { useAuthStore } from "../store/AuthStore";
import Dashboard from "../pages/Dashboard";
import AppShell from "../layouts/AppShell";
import Settings from "../pages/Settings";
import Projects from "../pages/Projects";
import { useSetupStore } from "../store/SetupStore";
import { refreshAccessToken } from "../api/http";
import { getJwtExpMs, isJwtExpiringSoon } from "../utils/jwt";

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm text-slate-200">
        Loading...
      </div>
    </div>
  );
}

function AuthBootstrap({ children }) {
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const logout = useAuthStore((s) => s.logout);

  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!hasHydrated) return;

      try {
        if (!token) {
          await refreshAccessToken();
          if (!cancelled) setBooted(true);
          return;
        }

        if (isJwtExpiringSoon(token, 60_000)) {
          await refreshAccessToken();
        }
      } catch (e) {
        const status = e?.response?.status;
        if (!token || status === 401 || status === 403) logout();
      } finally {
        if (!cancelled) setBooted(true);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, token, logout]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) return;

    const expMs = getJwtExpMs(token);
    if (!expMs) return;

    const skewMs = 60_000;
    const delayMs = Math.max(0, expMs - Date.now() - skewMs);

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        await refreshAccessToken();
      } catch (e) {
        const status = e?.response?.status;
        if (!cancelled && (status === 401 || status === 403)) logout();
      }
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [hasHydrated, token, logout]);

  if (!hasHydrated || !booted) return <FullScreenLoader />;
  return children;
}

function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const location = useLocation();

  if (!hasHydrated) return <FullScreenLoader />;
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function PublicOnly({ children }) {
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  if (!hasHydrated) return <FullScreenLoader />;
  if (token) return <Navigate to="/" replace />;
  return children;
}

function PostAuthRedirect() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const ensureSetupLoaded = useSetupStore((s) => s.ensureLoaded);
  const resetSetup = useSetupStore((s) => s.reset);

  const [dest, setDest] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const configured = await ensureSetupLoaded(token);

        if (!cancelled) {
          setDest(configured ? "/dashboard" : "/settings");
        }
      } catch (e) {
        const status = e?.response?.status;

        if (!cancelled && (status === 401 || status === 403)) {
          resetSetup();
          logout();
          setDest("/login");
          return;
        }

        if (!cancelled) setDest("/settings");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, ensureSetupLoaded, logout, resetSetup]);

  if (!dest) return <FullScreenLoader />;
  return <Navigate to={dest} replace />;
}

function SetupGate({ children }) {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  const ensureSetupLoaded = useSetupStore((s) => s.ensureLoaded);
  const resetSetup = useSetupStore((s) => s.reset);

  const status = useSetupStore((s) => s.status);
  const configured = useSetupStore((s) => s.isConfigured);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        await ensureSetupLoaded(token);
      } catch (e) {
        const httpStatus = e?.response?.status;

        if (!cancelled && (httpStatus === 401 || httpStatus === 403)) {
          resetSetup();
          logout();
          return;
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, ensureSetupLoaded, logout, resetSetup]);

  const isSettings = location.pathname.startsWith("/settings");

  if (status === "loading" || configured === null) return <FullScreenLoader />;
  if (!configured && !isSettings) return <Navigate to="/settings" replace />;
  return children;
}

export default function AppRouter() {
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          <Route
            path="/"
            element={
              !hasHydrated ? (
                <FullScreenLoader />
              ) : !token ? (
                <Navigate to="/login" replace />
              ) : (
                <PostAuthRedirect />
              )
            }
          />

          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            }
          />

          <Route
            path="/verify-otp"
            element={
              <PublicOnly>
                <VerifyOtpPage />
              </PublicOnly>
            }
          />

          <Route
            element={
              <RequireAuth>
                <SetupGate>
                  <AppShell />
                </SetupGate>
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/projects" element={<Projects />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
};