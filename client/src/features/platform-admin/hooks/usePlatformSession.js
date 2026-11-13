import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  platformLogin,
  platformLogout,
  platformMe,
  platformRefresh,
} from "../utils/platformApi.js";

/** 'checking' → tries the refresh cookie once; then 'in' (with the admin's profile) or 'out'. */
export function usePlatformSession() {
  const [status, setStatus] = useState("checking");
  const [admin, setAdmin] = useState(null);
  useEffect(() => {
    platformRefresh()
      .then(platformMe)
      .then((a) => {
        setAdmin(a);
        setStatus("in");
      })
      .catch(() => setStatus("out"));
    const out = () => {
      setAdmin(null);
      setStatus("out");
    };
    window.addEventListener("aura:platform-logout", out);
    return () => {
      window.removeEventListener("aura:platform-logout", out);
    };
  }, []);
  const login = useCallback(async (email, password) => {
    setAdmin(await platformLogin(email, password));
    setStatus("in");
  }, []);
  const logout = useCallback(async () => {
    await platformLogout();
    setAdmin(null);
    setStatus("out");
  }, []);
  return { status, admin, login, logout };
}

/** Who is signed in to the platform admin, for any page under /platform. */
export const PlatformContext = createContext({
  admin: null,
  isSuper: false,
  logout: () => {},
});
export const usePlatform = () => useContext(PlatformContext);
