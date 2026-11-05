import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "../../../lib/api.js";

/**
 * The floor plan: chairs grouped by floor with their open tickets.
 * Refreshes every 20 s and when the tab regains focus, so several counters stay in step.
 */
export function useFloor() {
  const [state, setState] = useState({
    chairs: null,
    error: null,
    loading: true,
    updatedAt: null,
  });
  const alive = useRef(true);
  const load = useCallback(async () => {
    try {
      const r = await api.get("/pos/floor");
      if (alive.current)
        setState({
          chairs: r.data.data.chairs,
          error: null,
          loading: false,
          updatedAt: new Date(),
        });
    } catch (e) {
      if (alive.current)
        setState((s) => ({ ...s, error: errorMessage(e), loading: false }));
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    load();
    const t = setInterval(load, 20000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      alive.current = false;
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);
  return { ...state, reload: load };
}
