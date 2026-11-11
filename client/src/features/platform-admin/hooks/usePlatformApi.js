import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "../../../lib/api.js";
import { platformApi } from "../utils/platformApi.js";

/** Same contract as the shared useApi hook (data stays on screen while it reloads), against the platform client. */
export function usePlatformApi(url) {
  const [state, setState] = useState({
    url: undefined,
    data: null,
    meta: null,
    loading: !!url,
    error: null,
  });
  const seq = useRef(0);
  const load = useCallback(async () => {
    const n = ++seq.current;
    if (!url) {
      setState({ url, data: null, meta: null, loading: false, error: null });
      return;
    }
    setState((s) =>
      s.url === url && s.data != null
        ? { ...s, error: null }
        : { url, data: null, meta: null, loading: true, error: null },
    );
    try {
      const r = await platformApi.get(url);
      if (n === seq.current)
        setState({
          url,
          data: r.data.data,
          meta: r.data.meta ?? null,
          loading: false,
          error: null,
        });
    } catch (e) {
      if (n === seq.current)
        setState((s) => ({
          ...s,
          url,
          loading: false,
          error: errorMessage(e),
        }));
    }
  }, [url]);
  useEffect(() => {
    load();
  }, [load]);
  const stale = state.url !== url;
  return {
    data: stale ? null : state.data,
    meta: stale ? null : state.meta,
    loading: stale ? !!url : state.loading,
    error: stale ? null : state.error,
    reload: load,
  };
}
