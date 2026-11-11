import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "../lib/api.js";

/**
 * GET a URL with loading/error state. Pass null to skip.
 * Returns { data, meta, loading, refreshing, error, reload }.
 *
 * - `loading` is true only while there is nothing to show yet. A reload keeps the current data on
 *   screen (`refreshing` is true instead), so pages don't flash a skeleton or jump back to the top.
 * - State remembers which URL it belongs to: right after the URL changes callers see loading=true
 *   and data=null — never another URL's data.
 * - Pull-to-refresh in the app shell fires `aura:refresh`; every mounted useApi reloads.
 */
export function useApi(url, deps = []) {
  const [state, setState] = useState({
    url: undefined,
    data: null,
    meta: null,
    loading: !!url,
    refreshing: false,
    error: null,
  });
  const seq = useRef(0);
  const load = useCallback(async () => {
    const n = ++seq.current;
    if (!url) {
      setState({
        url,
        data: null,
        meta: null,
        loading: false,
        refreshing: false,
        error: null,
      });
      return;
    }
    setState((s) =>
      s.url === url && s.data != null
        ? { ...s, refreshing: true, error: null }
        : {
            url,
            data: null,
            meta: null,
            loading: true,
            refreshing: false,
            error: null,
          },
    );
    try {
      const r = await api.get(url);
      if (n === seq.current)
        setState({
          url,
          data: r.data.data,
          meta: r.data.meta ?? null,
          loading: false,
          refreshing: false,
          error: null,
        });
    } catch (e) {
      // Keep what is on screen if a background reload fails; show the error alongside it.
      if (n === seq.current)
        setState((s) => ({
          ...s,
          url,
          loading: false,
          refreshing: false,
          error: errorMessage(e),
        }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);
  useEffect(() => {
    load();
  }, [load]);
  useRefreshListener(load);
  const stale = state.url !== url;
  return {
    data: stale ? null : state.data,
    meta: stale ? null : state.meta,
    loading: stale ? !!url : state.loading,
    refreshing: stale ? false : state.refreshing,
    error: stale ? null : state.error,
    reload: load,
  };
}

/** Run `fn` when the user pulls to refresh (or anything dispatches `aura:refresh`). */
export function useRefreshListener(fn) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const h = (e) => {
      const p = Promise.resolve(ref.current());
      e.detail?.wait?.(p);
    };
    window.addEventListener("aura:refresh", h);
    return () => window.removeEventListener("aura:refresh", h);
  }, []);
}

/** Ask every listening page to reload; resolves when they have all finished. */
export function refreshAll() {
  const waits = [];
  window.dispatchEvent(
    new CustomEvent("aura:refresh", { detail: { wait: (p) => waits.push(p) } }),
  );
  return Promise.allSettled(waits);
}
