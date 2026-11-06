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
    let mounted = true;

    setSessionLostHandler(() => {
      if (!mounted) return;

      setAccessToken(null);
      setMe(null);
      setStatus("anon");
    });

    const restoreAuth = async () => {
      try {
        await refreshSession();
        const r = await api.get("/auth/me");

        if (!mounted) return;

        const user = r.data.data;

        setMe(user);

        if (!sessionStorage.getItem("aura.branch") && user?.branches?.length) {
          sessionStorage.setItem("aura.branch", user.branches[0].id);
        }

        setStatus("authed");
      } catch (error) {
        if (!mounted) return;

        setAccessToken(null);
        setMe(null);
        setStatus("anon");

        console.error("Session restoration failed:", error);
      }
    };

    restoreAuth();

    const onEnt = () => {
      loadMe().catch(console.error);
    };

    window.addEventListener("aura:entitlement", onEnt);

    return () => {
      mounted = false;
      window.removeEventListener("aura:entitlement", onEnt);
    };
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
    await api.post("/auth/logout").catch(() => {});
    setAccessToken(null);
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
