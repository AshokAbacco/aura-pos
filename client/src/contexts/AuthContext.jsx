import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  api,
  endSession,
  isTransient,
  refreshSession,
  setAccessToken,
  setSessionLostHandler,
  takeRefreshedMe,
} from "../lib/api.js";
import { getRefreshToken } from "../lib/native.js";
import {
  clearCache,
  readSavedMe,
  saveMe,
  setCacheScope,
} from "../lib/cache.js";

const AuthContext = createContext(null);

/**
 * Who is signed in.
 * status: loading | authed | anon | offline (signed in, but the server can't be reached yet)
 *
 * Opening the phone app is instant: the last profile is kept on the device, so the app shows the
 * dashboard straight away (with the last data, see lib/cache.js) and restores the session in the
 * background. Only a refused session (401) signs the user out.
 */
export function AuthProvider({ children }) {
  const [me, setMeState] = useState(null);
  const [status, setStatus] = useState("loading");
  const retryTimer = useRef(null);

  const setMe = useCallback((m) => {
    setMeState(m);
    saveMe(m);
    setCacheScope(m?.user.id);
    if (
      m &&
      !m.branches.some((b) => b.id === sessionStorage.getItem("aura.branch")) &&
      m.branches[0]
    )
      sessionStorage.setItem("aura.branch", m.branches[0].id);
  }, []);

  const loadMe = useCallback(async () => {
    const r = await api.get("/auth/me");
    setMe(r.data.data);
    setStatus("authed");
    return r.data.data;
  }, [setMe]);

  const signedOut = useCallback(() => {
    setAccessToken(null);
    setMe(null);
    clearCache();
    setStatus("anon");
  }, [setMe]);

  /** Restore the session (HttpOnly cookie in the browser, saved token in the app). */
  const restore = useCallback(
    async (attempt = 0) => {
      clearTimeout(retryTimer.current);
      try {
        await refreshSession();
        const m = takeRefreshedMe();
        if (m) {
          setMe(m);
          setStatus("authed");
        } else await loadMe();
      } catch (e) {
        if (!isTransient(e)) {
          signedOut();
          return;
        } // the server said no: sign in again
        // No connection or the server is starting. With a saved profile the app keeps working on the
        // last data; otherwise show "Connecting…". Either way keep trying (5 s, 10 s … up to 30 s).
        setStatus((s) => (s === "authed" ? "authed" : "offline"));
        retryTimer.current = setTimeout(
          () => restore(attempt + 1),
          Math.min(30000, 5000 * (attempt + 1)),
        );
      }
    },
    [loadMe, setMe, signedOut],
  );

  useEffect(() => {
    setSessionLostHandler(signedOut);
    (async () => {
      // Phone app: open straight onto the last screen data while the session is restored.
      const saved = readSavedMe();
      if (saved && (await getRefreshToken())) {
        setMe(saved);
        setStatus("authed");
      }
      restore();
    })();
    const onEnt = () => loadMe().catch(() => {});
    const onOnline = () => restore();
    window.addEventListener("aura:entitlement", onEnt);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("aura:entitlement", onEnt);
      window.removeEventListener("online", onOnline);
      clearTimeout(retryTimer.current);
    };
  }, [loadMe, restore, setMe, signedOut]);

  const login = useCallback(
    async (email, password, remember = true) => {
      // ?include=me: the profile comes back with the tokens, so the dashboard opens after one request.
      const r = await api.post("/auth/login?include=me", {
        email,
        password,
        remember,
      });
      setAccessToken(r.data.data.accessToken);
      if (r.data.data.me) {
        setMe(r.data.data.me);
        setStatus("authed");
        return r.data.data.me;
      }
      return loadMe();
    },
    [loadMe, setMe],
  );

  const adoptToken = useCallback(
    async (token) => {
      setAccessToken(token);
      return loadMe();
    },
    [loadMe],
  );

  const logout = useCallback(async () => {
    clearTimeout(retryTimer.current);
    // Show the login screen straight away; the server is told in the background (it may be unreachable).
    const ending = endSession();
    signedOut();
    sessionStorage.removeItem("aura.branch");
    await ending;
  }, [signedOut]);

  const value = useMemo(
    () => ({
      me,
      status,
      login,
      logout,
      adoptToken,
      reload: loadMe,
      retry: () => restore(),
      can: (p) => !!me?.permissions.includes(p),
      writable: !!me?.entitlement.writable,
    }),
    [me, status, login, logout, adoptToken, loadMe, restore],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
