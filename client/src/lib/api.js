/**
 * API client. The access token lives only in memory (never localStorage — XSS can't
 * lift a persisted token). In the browser the refresh token is an HttpOnly cookie the JS can't read.
 * In the Android app (no cookies across sites) it is kept in app storage — see lib/native.js.
 * On 401 we refresh once (single-flight) and retry; failure sends the user to login.
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
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: !isNative,
  headers: BASE_HEADERS,
});

// The app receives refresh tokens in response bodies (login, register, accept invite, refresh): keep the newest.
api.interceptors.response.use(async (r) => {
  const rt = isNative ? r.data?.data?.refreshToken : undefined;
  if (rt) await setRefreshToken(rt);
  return r;
});

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  const branch = sessionStorage.getItem("aura.branch");
  if (branch && !cfg.headers["X-Branch-Id"])
    cfg.headers["X-Branch-Id"] = branch;
  return cfg;
});

let refreshing = null;
export function refreshSession() {
  refreshing ??= (async () => {
    const body = isNative ? { refreshToken: await getRefreshToken() } : null;
    if (isNative && !body.refreshToken) throw new Error("No saved session");
    try {
      const r = await axios.post(`${API_BASE_URL}/auth/refresh`, body, {
        withCredentials: !isNative,
        headers: BASE_HEADERS,
      });
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
  (r) => r,
  async (err) => {
    const cfg = err.config;
    const code = err.response?.data?.error?.code;
    if (
      err.response?.status === 401 &&
      !cfg._retried &&
      !cfg.url.startsWith("/auth/")
    ) {
      cfg._retried = true;
      try {
        await refreshSession();
        return api(cfg);
      } catch {
        onSessionLost();
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
  if (!e)
    return err?.message === "Network Error"
      ? "Cannot reach the server. Check your connection."
      : "Something went wrong. Please try again.";
  if (e.details?.length && e.code === "VALIDATION_FAILED")
    return e.details
      .map((d) => (d.path ? `${d.path}: ${d.message}` : d.message))
      .join(" · ");
  return e.message;
}
