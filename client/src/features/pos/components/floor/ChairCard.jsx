import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuArmchair,
  LuSofa,
  LuHand,
  LuEllipsisVertical,
  LuArrowRightLeft,
  LuTrash2,
  LuEye,
  LuCalendarClock,
  LuPlus,
  LuClock3,
} from "react-icons/lu";
import { money } from "../../../../utils/format.js";
import { cx } from "../../../../utils/cx.js";
import { elapsed, timeOf, KIND_LABEL } from "../../utils/floor.js";

const KIND_ICON = { CHAIR: LuArmchair, ROOM: LuSofa, STATION: LuHand };

/**
 * One chair on the floor plan. Tapping the card opens the chair (add or remove items).
 * Busy chairs also offer "View bill" (bill panel) and a menu to move or clear the ticket.
 */
export function ChairCard({ chair, now, canBill, onView, onMove, onClear }) {
  const t = chair.ticket;
  const busy = !!t;
  const Icon = KIND_ICON[chair.kind] ?? LuArmchair;
  const next = chair.nextAppointment;
  const bookedSoon = !busy && next;
  return (
    <article
      className={cx(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-white transition hover:-translate-y-0.5 hover:shadow-md",
        busy
          ? "border-rose-200 shadow-[0_10px_30px_-18px_rgb(161_43_60/.6)]"
          : bookedSoon
            ? "border-amber-200"
            : "border-stone-200",
      )}
    >
      <span
        className={cx(
          "h-1",
          busy
            ? "bg-gradient-to-r from-rose-700 to-rose-500"
            : bookedSoon
              ? "bg-amber-400"
              : "bg-emerald-400",
        )}
        aria-hidden
      />
      <Link
        to={`/app/pos/chairs/${chair.id}`}
        className="flex flex-1 flex-col p-3 focus-visible:outline-offset-[-2px]"
        aria-label={`${chair.name}: ${busy ? "open ticket" : "free"}. Open chair`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cx(
                "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                busy
                  ? "bg-rose-50 text-rose-700"
                  : "bg-stone-100 text-stone-600",
              )}
            >
              <Icon size={16} />
            </span>
            <span className="min-w-0">
              <b className="block truncate text-sm leading-tight text-stone-900">
                {chair.name}
              </b>
              <span className="text-[11px] text-stone-500">
                {KIND_LABEL[chair.kind] ?? chair.kind}
              </span>
            </span>
          </div>
          {busy ? (
            <span
              className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-rose-600"
              title="In service"
              aria-hidden
            />
          ) : bookedSoon ? (
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              Booked {timeOf(next.startsAt)}
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Free
            </span>
          )}
        </div>

        {busy ? (
          <div className="mt-2.5 flex flex-1 flex-col">
            <p className="truncate text-[13px] font-semibold text-stone-900">
              {t.customer?.name ?? "Walk-in client"}
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1">
              {t.items.slice(0, 2).map((n, i) => (
                <li
                  key={i}
                  className="max-w-full truncate rounded bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-700"
                >
                  {n}
                </li>
              ))}
              {t.itemCount > Math.min(2, t.items.length) && (
                <li className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-500">
                  +{t.itemCount - Math.min(2, t.items.length)}
                </li>
              )}
              {!t.itemCount && (
                <li className="text-[11px] text-stone-500">No items yet</li>
              )}
            </ul>
            {t.stylists.length > 0 && (
              <p className="mt-1 truncate text-[11px] text-stone-500">
                with {t.stylists.join(", ")}
              </p>
            )}
            <div className="mt-auto flex items-end justify-between pt-2">
              <span className="text-[11px] leading-tight text-stone-500">
                {t.itemCount} item{t.itemCount === 1 ? "" : "s"}
                <span className="flex items-center gap-1 font-semibold text-rose-700">
                  <LuClock3 size={11} aria-hidden />
                  {elapsed(t.openedAt, now)}
                </span>
              </span>
              <span className="num text-base font-extrabold text-stone-900">
                {t.estimate ? money(t.estimate) : "—"}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-2.5 flex flex-1 flex-col justify-center rounded-lg border border-dashed border-stone-300 px-2 py-2 text-center transition group-hover:border-rose-300">
            {bookedSoon ? (
              <p className="truncate text-xs text-stone-700">
                <LuCalendarClock className="mr-1 inline text-amber-600" />
                <b>{next.customer?.name ?? "Client"}</b> · {next.serviceName}
                <span className="block truncate text-[11px] text-stone-500">
                  {next.staff?.name ? `with ${next.staff.name}` : ""}
                </span>
              </p>
            ) : (
              <p className="flex items-center justify-center gap-1 text-xs font-medium text-stone-500 group-hover:text-rose-700">
                <LuPlus size={13} /> Seat a client
              </p>
            )}
          </div>
        )}
      </Link>

      {busy && (
        <div className="flex items-center gap-1.5 border-t border-stone-100 bg-stone-50/70 p-2">
          <button
            type="button"
            onClick={() => onView(chair)}
            aria-label={`View bill for ${chair.name}`}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-stone-300 bg-white py-1.5 text-xs font-semibold text-stone-800 hover:border-stone-400"
          >
            <LuEye size={13} /> View
          </button>
          {canBill && (
            <button
              type="button"
              onClick={() => onView(chair, { pay: true })}
              disabled={!t.itemCount}
              className="flex-1 rounded-md bg-rose-700 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
            >
              Bill
            </button>
          )}
          <CardMenu chair={chair} onMove={onMove} onClear={onClear} />
        </div>
      )}
    </article>
  );
}

function CardMenu({ chair, onMove, onClear }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const esc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`More actions for ${chair.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="grid h-7 w-7 place-items-center rounded-md text-stone-500 hover:bg-white hover:text-stone-900"
      >
        <LuEllipsisVertical size={15} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-9 right-0 z-20 w-48 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 text-sm shadow-xl"
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onMove(chair);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-stone-50"
          >
            <LuArrowRightLeft /> Move to another chair
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onClear(chair);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-700 hover:bg-rose-50"
          >
            <LuTrash2 /> Clear without billing
          </button>
        </div>
      )}
    </div>
  );
}
