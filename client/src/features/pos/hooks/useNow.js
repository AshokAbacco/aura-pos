import { useEffect, useState } from "react";

/** Current time, refreshed every `ms` (for "in chair for 25 min" labels). */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
