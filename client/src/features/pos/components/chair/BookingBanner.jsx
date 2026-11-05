import { LuCalendarClock } from "react-icons/lu";
import { timeOf } from "../../utils/floor.js";

/** Today's booking for this chair, with one tap to pull the booked service into the ticket. */
export function BookingBanner({ appointment: a, onAdd, busy }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <p className="flex items-center gap-2 text-amber-900">
        <LuCalendarClock className="shrink-0" />
        <span>
          <b>{a.customer?.name ?? "Client"}</b> booked <b>{a.serviceName}</b> at{" "}
          {timeOf(a.startsAt)}
          {a.staff?.name ? ` with ${a.staff.name}` : ""}.
        </span>
      </p>
      <button
        type="button"
        onClick={onAdd}
        disabled={busy}
        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        Add booking to this chair
      </button>
    </div>
  );
}
