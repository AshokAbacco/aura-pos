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
} from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  // loading | authed | anon | offline (signed in, but the server can't be reached yet: keep the session and retry)
  const [status, setStatus] = useState("loading");
  const retryTimer = useRef(null);

  const loadMe = useCallback(async () => {
    const r = await api.get("/auth/me");
    setMe(r.data.data);
    if (!sessionStorage.getItem("aura.branch") && r.data.data.branches[0])
      sessionStorage.setItem("aura.branch", r.data.data.branches[0].id);
    setStatus("authed");
    return r.data.data;
  }, []);

  /** Restore the session (HttpOnly cookie in the browser, saved token in the app). */
  const restore = useCallback(
    async (attempt = 0) => {
      clearTimeout(retryTimer.current);
      try {
        await refreshSession();
        await loadMe();
      } catch (e) {
        if (!isTransient(e)) {
          setStatus("anon");
          return;
        } // the server said no: sign in again
        // No connection or the server is starting: stay signed in and try again (5 s, 10 s … up to 30 s).
        setStatus("offline");
        retryTimer.current = setTimeout(
          () => restore(attempt + 1),
          Math.min(30000, 5000 * (attempt + 1)),
        );
      }
    },
    [loadMe],
  );

  useEffect(() => {
    setSessionLostHandler(() => {
      setAccessToken(null);
      setMe(null);
      setStatus("anon");
    });
    restore();
    const onEnt = () => loadMe().catch(() => {});
    const onOnline = () =>
      setStatus((s) => {
        if (s === "offline") restore();
        return s;
      });
    window.addEventListener("aura:entitlement", onEnt);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("aura:entitlement", onEnt);
      window.removeEventListener("online", onOnline);
      clearTimeout(retryTimer.current);
    };
  }, [loadMe, restore]);

  const login = useCallback(
    async (email, password, remember = true) => {
      const r = await api.post("/auth/login", { email, password, remember });
      setAccessToken(r.data.data.accessToken);
      return loadMe();
    },
    [loadMe],
  );

  const adoptToken = useCallback(
    async (token) => {
      setAccessToken(token);
      return loadMe();
    },
    [loadMe],
  );

  const logout = useCallback(async () => {
    await endSession();
    setMe(null);
    setStatus("anon");
    sessionStorage.removeItem("aura.branch");
  }, []);

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
