import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuBell, LuCheckCheck } from "react-icons/lu";
import { api } from "../../../lib/api.js";
import { useRefreshListener } from "../../../hooks/useApi.js";
import { dateTime } from "../../../utils/format.js";
import { cx } from "../../../utils/cx.js";

const KIND = {
  RENEWAL: "Renewal",
  NEW_PLAN: "New plan",
  ANNOUNCEMENT: "News",
  CUSTOM: "Message",
};

/**
 * Messages from the Salora Glam team (renewal reminders, new plans, announcements).
 * Checks every 5 minutes and on pull-to-refresh; opening a message marks it read.
 */
export function InboxBell() {
  const nav = useNavigate();
  const [data, setData] = useState({ rows: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const load = useCallback(
    () =>
      api
        .get("/inbox")
        .then((r) => setData(r.data.data))
        .catch(() => {}),
    [],
  );
  useEffect(() => {
    load();
    const t = setInterval(load, 5 * 60000);
    return () => clearInterval(t);
  }, [load]);
  useRefreshListener(load);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (!box.current?.contains(e.target)) setOpen(false);
    };
    const esc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const read = async (m) => {
    if (!m.readAt) {
      setData((d) => ({
        unread: Math.max(0, d.unread - 1),
        rows: d.rows.map((x) =>
          x.id === m.id ? { ...x, readAt: new Date().toISOString() } : x,
        ),
      }));
      api.post(`/inbox/${m.id}/read`).catch(() => {});
    }
    if (m.link) {
      setOpen(false);
      if (m.link.startsWith("/")) nav(m.link);
      else window.open(m.link, "_blank", "noopener");
    }
  };
  const readAll = async () => {
    setData((d) => ({
      unread: 0,
      rows: d.rows.map((x) => ({
        ...x,
        readAt: x.readAt ?? new Date().toISOString(),
      })),
    }));
    api.post("/inbox/all/read").catch(() => {});
  };

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Messages${data.unread ? `, ${data.unread} unread` : ""}`}
        aria-expanded={open}
        className="relative rounded-md p-2 text-stone-600 hover:bg-stone-100"
      >
        <LuBell size={18} />
        {data.unread > 0 && (
          <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Messages"
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2.5">
            <p className="font-semibold">Messages</p>
            {data.unread > 0 && (
              <button
                onClick={readAll}
                className="flex items-center gap-1 text-xs font-semibold text-rose-700"
              >
                <LuCheckCheck aria-hidden /> Mark all read
              </button>
            )}
          </div>
          {!data.rows.length ? (
            <p className="px-4 py-8 text-center text-sm text-stone-500">
              No messages yet.
            </p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-stone-100 overflow-y-auto">
              {data.rows.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => read(m)}
                    className={cx(
                      "block w-full px-4 py-3 text-left hover:bg-stone-50",
                      !m.readAt && "bg-rose-50/50",
                    )}
                  >
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                      {!m.readAt && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-rose-600"
                          aria-label="unread"
                        />
                      )}
                      {KIND[m.kind] ?? "Message"} ·{" "}
                      <span className="font-normal normal-case tracking-normal text-stone-500">
                        {dateTime(m.createdAt)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-stone-900">
                      {m.title}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-stone-600">
                      {m.body}
                    </p>
                    {m.link && (
                      <span className="mt-1 inline-block text-sm font-semibold text-rose-700">
                        Open →
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
