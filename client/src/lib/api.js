/**
 * API client. The access token lives only in memory (never localStorage — XSS can't
 * lift a persisted token). In the browser the refresh token is an HttpOnly cookie the JS can't read.
 * In the Android app (no cookies across sites) it is kept in app storage — see lib/native.js.
 * On 401 we refresh once (single-flight) and retry. Only a refused refresh (401) signs the user out:
 * a network error, a timeout or a server that is still waking up never does.
 * GET requests that fail for those reasons are retried twice before the page shows an error.
 */
import axios from "axios";
import { isNative, getRefreshToken, setRefreshToken } from "./native.js";

let accessToken = null;
let onSessionLost = () => {};
export const setAccessToken = (t) => {
  accessToken = t;
};
export const setSessionLostHandler = (fn) => {
  onSessionLost = fn;
};

/** e.g. http://localhost:4000/api/v1 (client/.env). Defaults to same-origin /api/v1 (single-port production). */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api/v1"
).replace(/\/$/, "");

const BASE_HEADERS = {
  "X-Requested-With": "XMLHttpRequest",
  ...(isNative ? { "X-Client-Platform": "native" } : {}),
};
// 60 s: a free Render instance can take ~50 s to wake up. Slower than that is treated as offline.
const TIMEOUT_MS = 60000;
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: !isNative,
  headers: BASE_HEADERS,
  timeout: TIMEOUT_MS,
});

/** True for "couldn't reach the server" (no response, timeout, gateway errors while the host starts). */
export const isTransient = (e) =>
  !e?.response || [502, 503, 504].includes(e.response.status);

// Tell the shell when a request is slow, so it can say "server is waking up" instead of looking frozen.
let pending = 0;
const slowEvent = (on) =>
  window.dispatchEvent(new CustomEvent("aura:slow", { detail: on }));
let slowTimer = null;
function track(delta) {
  pending = Math.max(0, pending + delta);
  if (pending && !slowTimer)
    slowTimer = setTimeout(() => slowEvent(true), 4000);
  if (!pending) {
    clearTimeout(slowTimer);
    slowTimer = null;
    slowEvent(false);
  }
}

// The app receives refresh tokens in response bodies (login, register, accept invite, refresh): keep the newest.
api.interceptors.response.use(async (r) => {
  const rt = isNative ? r.data?.data?.refreshToken : undefined;
  if (rt) await setRefreshToken(rt);
  return r;
});

api.interceptors.request.use((cfg) => {
  if (!cfg._tracked) {
    cfg._tracked = true;
    track(1);
  }
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  const branch = sessionStorage.getItem("aura.branch");
  if (branch && !cfg.headers["X-Branch-Id"])
    cfg.headers["X-Branch-Id"] = branch;
  return cfg;
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function withRetry(fn, tries = 3) {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries - 1 || !isTransient(e)) throw e;
      await sleep(1500 * (i + 1));
    }
  }
}

let refreshing = null;
export function refreshSession() {
  refreshing ??= (async () => {
    const body = isNative ? { refreshToken: await getRefreshToken() } : null;
    if (isNative && !body.refreshToken) throw new Error("No saved session");
    try {
      const r = await withRetry(() =>
        axios.post(`${API_BASE_URL}/auth/refresh`, body, {
          withCredentials: !isNative,
          headers: BASE_HEADERS,
          timeout: TIMEOUT_MS,
        }),
      );
      if (isNative) await setRefreshToken(r.data.data.refreshToken);
      setAccessToken(r.data.data.accessToken);
      return r.data.data.accessToken;
    } catch (e) {
      if (isNative && e.response?.status === 401) await setRefreshToken(null); // revoked or expired
      throw e;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Sign out: the server revokes the session (cookie in the browser, saved token in the app). */
export async function endSession() {
  const body = isNative ? { refreshToken: await getRefreshToken() } : undefined;
  await api.post("/auth/logout", body).catch(() => {});
  await setRefreshToken(null);
  setAccessToken(null);
}

api.interceptors.response.use(
  (r) => {
    if (r.config._tracked) track(-1);
    return r;
  },
  async (err) => {
    const cfg = err.config ?? {};
    const code = err.response?.data?.error?.code;
    // Retry reads that never reached the app (offline blip, timeout, host restarting).
    if (
      isTransient(err) &&
      (cfg.method ?? "get") === "get" &&
      (cfg._attempt ?? 0) < 2 &&
      cfg.url
    ) {
      cfg._attempt = (cfg._attempt ?? 0) + 1;
      await sleep(1500 * cfg._attempt);
      return api(cfg);
    }
    if (cfg._tracked) {
      cfg._tracked = false;
      track(-1);
    }
    if (
      err.response?.status === 401 &&
      !cfg._retried &&
      cfg.url &&
      !cfg.url.startsWith("/auth/")
    ) {
      cfg._retried = true;
      try {
        await refreshSession();
        return api(cfg);
      } catch (e) {
        // Signed out only when the server refused the session; a connection problem keeps you signed in.
        if (e?.response?.status === 401) onSessionLost();
      }
    }
    if (err.response?.status === 402 || err.response?.status === 423) {
      window.dispatchEvent(
        new CustomEvent("aura:entitlement", { detail: code }),
      );
    }
    return Promise.reject(err);
  },
);

/** Human message for any API error, with field details when present. */
export function errorMessage(err) {
  const e = err?.response?.data?.error;
  if (!e) {
    if (
      err?.code === "ECONNABORTED" ||
      err?.message === "Network Error" ||
      [502, 503, 504].includes(err?.response?.status)
    )
      return "Cannot reach the server. Check your internet connection and try again.";
    return "Something went wrong. Please try again.";
  }
  if (e.details?.length && e.code === "VALIDATION_FAILED")
    return e.details
      .map((d) => (d.path ? `${d.path}: ${d.message}` : d.message))
      .join(" · ");
  return e.message;
}
