import {
  LuArmchair,
  LuSparkles,
  LuReceiptText,
  LuCalendarClock,
} from "react-icons/lu";
import { money0 } from "../../../../utils/format.js";

/** Four glanceable numbers at the top of the counter. */
export function FloorSummary({ chairs }) {
  const busy = chairs.filter((c) => c.ticket);
  const open = busy.reduce((a, c) => a + Number(c.ticket.estimate ?? 0), 0);
  const booked = chairs.filter((c) => !c.ticket && c.nextAppointment).length;
  const tiles = [
    [LuSparkles, "In service", busy.length, "bg-rose-50 text-rose-700"],
    [
      LuArmchair,
      "Free chairs",
      chairs.length - busy.length,
      "bg-emerald-50 text-emerald-700",
    ],
    [LuReceiptText, "Open bills", money0(open), "bg-stone-100 text-stone-700"],
    [LuCalendarClock, "Booked next", booked, "bg-amber-50 text-amber-700"],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(([Icon, label, value, tone]) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3.5"
        >
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}
          >
            <Icon size={20} />
          </span>
          <span>
            <span className="block text-xs text-stone-500">{label}</span>
            <span className="num block text-xl font-extrabold text-stone-900">
              {value}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
