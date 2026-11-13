/**
 * Separate API client for the platform Super Admin area. It keeps its own in-memory token and
 * refreshes through /platform/auth/refresh (its own HttpOnly cookie) — a salon login never works here.
 */
import axios from "axios";
import { API_BASE_URL } from "../../../lib/api.js";

let token = null;
const headers = { "X-Requested-With": "XMLHttpRequest" };
export const platformApi = axios.create({
  baseURL: `${API_BASE_URL}/platform`,
  withCredentials: true,
  headers,
});
platformApi.interceptors.request.use((cfg) => {
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export async function platformLogin(email, password) {
  const r = await platformApi.post("/auth/login", { email, password });
  token = r.data.data.accessToken;
  return r.data.data.admin;
}
/** The signed-in platform admin: { id, name, email, role: 'SUPER_ADMIN' | 'SUPPORT' }. */
export async function platformMe() {
  return (await platformApi.get("/auth/me")).data.data;
}
export async function platformRefresh() {
  const r = await platformApi.post("/auth/refresh");
  token = r.data.data.accessToken;
}
export async function platformLogout() {
  try {
    await platformApi.post("/auth/logout");
  } finally {
    token = null;
  }
}

let refreshing = null;
platformApi.interceptors.response.use(
  (r) => r,
  async (err) => {
    const cfg = err.config;
    if (
      err.response?.status === 401 &&
      !cfg._retried &&
      !cfg.url.startsWith("/auth/")
    ) {
      cfg._retried = true;
      refreshing ??= platformRefresh().finally(() => {
        refreshing = null;
      });
      try {
        await refreshing;
        return platformApi(cfg);
      } catch {
        window.dispatchEvent(new Event("aura:platform-logout"));
      }
    }
    return Promise.reject(err);
  },
);
