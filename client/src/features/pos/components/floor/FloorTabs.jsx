import { cx } from "../../../../utils/cx.js";

/** "All floors" + one tab per floor, each with busy/total counts. */
export function FloorTabs({ floors, value, onChange }) {
  const all = floors.flatMap(([, cs]) => cs);
  const tabs = [
    ["all", "All floors", all],
    ...floors.map(([f, cs]) => [f, f, cs]),
  ];
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      role="tablist"
      aria-label="Floors"
    >
      {tabs.map(([id, label, cs]) => {
        const busy = cs.filter((c) => c.ticket).length;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={value === id}
            onClick={() => onChange(id)}
            className={cx(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
              value === id
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:border-stone-400",
            )}
          >
            {label}
            <span
              className={cx(
                "num rounded-full px-2 py-0.5 text-[11px]",
                value === id ? "bg-white/15" : "bg-stone-100 text-stone-600",
              )}
            >
              {busy}/{cs.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}
