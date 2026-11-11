import { useEffect, useState } from "react";
import { LuLoaderCircle } from "react-icons/lu";

/** Shown when a request takes more than 4 s — usually the server waking up after being idle. */
export function SlowServerNotice() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const h = (e) => setSlow(!!e.detail);
    window.addEventListener("aura:slow", h);
    return () => window.removeEventListener("aura:slow", h);
  }, []);
  if (!slow) return null;
  return (
    <div
      role="status"
      className="no-print fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4"
    >
      <p className="flex items-center gap-2 rounded-full bg-stone-900/90 px-4 py-2 text-sm text-white shadow-lg">
        <LuLoaderCircle className="animate-spin" aria-hidden /> Still loading —
        the server may be waking up…
      </p>
    </div>
  );
}
