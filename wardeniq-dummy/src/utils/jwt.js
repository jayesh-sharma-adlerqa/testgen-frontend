function base64UrlDecode(input) {
  const raw = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = raw.length % 4 === 0 ? "" : "=".repeat(4 - (raw.length % 4));
  const normalized = raw + pad;
  try {
    return atob(normalized);
  } catch {
    return null;
  }
}

export function getJwtPayload(token) {
  const t = String(token || "");
  const parts = t.split(".");
  if (parts.length < 2) return null;

  const decoded = base64UrlDecode(parts[1]);
  if (!decoded) return null;

  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getJwtExpMs(token) {
  const payload = getJwtPayload(token);
  const exp = payload?.exp;
  if (!Number.isFinite(Number(exp))) return null;
  return Number(exp) * 1000;
}

export function isJwtExpiringSoon(token, skewMs = 60_000) {
  const expMs = getJwtExpMs(token);
  if (!expMs) return false;
  return expMs <= Date.now() + Math.max(0, Number(skewMs) || 0);
}