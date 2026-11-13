import { useEffect, useState } from "react";
import { api } from "../../../lib/api.js";

const KEY = "aura.loginMethod";
const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

/**
 * How salon users sign in, chosen by the platform admin: 'EMAIL' | 'PHONE' | 'BOTH'.
 * The last known value is remembered so the login page shows the right field instantly.
 */
export function useLoginMethod() {
  const [method, setMethod] = useState(() => read() ?? "EMAIL");
  useEffect(() => {
    let alive = true;
    api
      .get("/public/config")
      .then((r) => {
        const m = r.data.data.loginMethod;
        if (!alive || !["EMAIL", "PHONE", "BOTH"].includes(m)) return;
        setMethod(m);
        try {
          localStorage.setItem(KEY, m);
        } catch {
          /* private mode */
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return method;
}
