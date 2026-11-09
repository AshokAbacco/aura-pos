import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  endSession,
  refreshSession,
  setAccessToken,
  setSessionLostHandler,
} from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authed | anon

  const loadMe = useCallback(async () => {
    const r = await api.get("/auth/me");
    setMe(r.data.data);
    if (!sessionStorage.getItem("aura.branch") && r.data.data.branches[0])
      sessionStorage.setItem("aura.branch", r.data.data.branches[0].id);
    setStatus("authed");
    return r.data.data;
  }, []);

  useEffect(() => {
    setSessionLostHandler(() => {
      setAccessToken(null);
      setMe(null);
      setStatus("anon");
    });
    // Restore a session on load (HttpOnly cookie in the browser, saved token in the app).
    refreshSession()
      .then(loadMe)
      .catch(() => setStatus("anon"));
    const onEnt = () => loadMe().catch(() => {});
    window.addEventListener("aura:entitlement", onEnt);
    return () => window.removeEventListener("aura:entitlement", onEnt);
  }, [loadMe]);

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
      can: (p) => !!me?.permissions.includes(p),
      writable: !!me?.entitlement.writable,
    }),
    [me, status, login, logout, adoptToken, loadMe],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
