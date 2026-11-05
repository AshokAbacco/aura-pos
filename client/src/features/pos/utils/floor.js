/** Helpers for the floor plan. */
export const KIND_LABEL = { CHAIR: "Chair", ROOM: "Room", STATION: "Station" };

/** "38 min" / "1 h 05 min" since a timestamp. */
export function elapsed(from, now = Date.now()) {
  const m = Math.max(0, Math.floor((now - new Date(from).getTime()) / 60000));
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
}

/** Chairs → [[floor, chairs]] in the server's order (floor, sort order, name). */
export function groupByFloor(chairs) {
  const map = new Map();
  for (const c of chairs) {
    if (!map.has(c.floor)) map.set(c.floor, []);
    map.get(c.floor).push(c);
  }
  return [...map.entries()];
}

export const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
