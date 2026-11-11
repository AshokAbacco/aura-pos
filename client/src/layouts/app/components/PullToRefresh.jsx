import { useEffect, useRef, useState } from "react";
import { LuRefreshCw } from "react-icons/lu";
import { refreshAll } from "../../../hooks/useApi.js";

const TRIGGER = 70; // px pulled before release refreshes
const MAX = 110;

/**
 * Pull down from the top of the page to reload its data (touch screens only).
 * Every useApi on the page, and the POS hooks, listen for the refresh; data stays on screen
 * while it reloads, so nothing jumps.
 */
export function PullToRefresh({ scrollRef, children }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef(null);
  const pullRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const atTop = () => el.scrollTop <= 0;
    // Don't hijack a pull that starts inside a dialog, a horizontally scrolling list, or a text field.
    const ignore = (t) =>
      t.closest?.('[role="dialog"],input,textarea,select,[data-no-pull]');
    const onStart = (e) => {
      if (busy || e.touches.length !== 1 || !atTop() || ignore(e.target))
        return;
      start.current = { y: e.touches[0].clientY, x: e.touches[0].clientX };
    };
    const onMove = (e) => {
      if (!start.current) return;
      const dy = e.touches[0].clientY - start.current.y;
      const dx = Math.abs(e.touches[0].clientX - start.current.x);
      if (dy <= 0 || dx > dy || !atTop()) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      const d = Math.min(MAX, dy * 0.5);
      pullRef.current = d;
      setPull(d);
      if (d > 4 && e.cancelable) e.preventDefault(); // stop the browser's own overscroll while pulling
    };
    const onEnd = async () => {
      if (!start.current) return;
      start.current = null;
      if (pullRef.current >= TRIGGER) {
        setBusy(true);
        setPull(48);
        await Promise.all([
          refreshAll(),
          new Promise((r) => setTimeout(r, 500)),
        ]);
        setBusy(false);
      }
      pullRef.current = 0;
      setPull(0);
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [scrollRef, busy]);

  const ready = pull >= TRIGGER;
  return (
    <>
      <div
        aria-live="polite"
        className="no-print pointer-events-none sticky top-0 z-20 flex h-0 justify-center overflow-visible"
      >
        {(pull > 0 || busy) && (
          <span
            style={{ transform: `translateY(${Math.max(8, pull - 30)}px)` }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-rose-700 shadow-md transition-transform"
          >
            <LuRefreshCw
              className={busy ? "animate-spin" : ""}
              style={
                busy
                  ? undefined
                  : {
                      transform: `rotate(${pull * 3}deg)`,
                      opacity: ready ? 1 : 0.5,
                    }
              }
              aria-hidden
            />
            <span className="sr-only">
              {busy
                ? "Refreshing"
                : ready
                ? "Release to refresh"
                : "Pull to refresh"}
            </span>
          </span>
        )}
      </div>
      <div
        style={pull ? { transform: `translateY(${pull * 0.4}px)` } : undefined}
        className={pull ? "" : "transition-transform duration-200"}
      >
        {children}
      </div>
    </>
  );
}
