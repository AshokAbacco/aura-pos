import { useState } from "react";
import { Link } from "react-router-dom";
import { LuSend, LuCheck, LuPhone, LuMessageCircle } from "react-icons/lu";
import { errorMessage } from "../../../lib/api.js";
import { date, dateTime } from "../../../utils/format.js";
import { useToast } from "../../../contexts/ToastContext.jsx";
import { Badge, Button, ErrorNote, Skeleton } from "../../../components/ui";
import { Field } from "../../../components/forms";
import { cx } from "../../../utils/cx.js";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { platformApi } from "../utils/platformApi.js";
import { PageTitle } from "../components/PageTitle.jsx";
import { StateBadge } from "../components/StateBadge.jsx";
import { MessageComposer } from "../components/MessageComposer.jsx";
import { NoteComposer } from "../components/NoteComposer.jsx";
import {
  NOTE_KINDS,
  MESSAGE_KINDS,
  daysLabel,
} from "../utils/platform.constants.js";

const BUCKETS = [
  [
    "expiring",
    "Plan ends soon",
    "Paid plans ending in the window: remind them to renew.",
    "amber",
  ],
  [
    "trial",
    "Trial ending",
    "Free trials about to end: a good moment to call.",
    "blue",
  ],
  [
    "grace",
    "In grace period",
    "Plan ended but still working for a few days.",
    "rose",
  ],
  [
    "expired",
    "Expired (last 60 days)",
    "Lost access recently: win them back.",
    "stone",
  ],
];
const wa = (phone) =>
  `https://wa.me/${String(phone)
    .replace(/\D/g, "")
    .replace(/^(\d{10})$/, "91$1")}`;

/** The renewals desk: who to contact today, and every open follow-up. */
export default function FollowUpsPage() {
  const toast = useToast();
  const [days, setDays] = useState(14);
  const desk = usePlatformApi(`/follow-ups?days=${days}`);
  const [tab, setTab] = useState("expiring");
  const [msg, setMsg] = useState(null); // { tenantIds, names, kind }
  const [note, setNote] = useState(null); // tenantId

  const doneNote = async (n) => {
    try {
      await platformApi.patch(`/notes/${n.id}`, { status: "DONE" });
      desk.reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
  if (desk.error && !desk.data)
    return <ErrorNote onRetry={desk.reload}>{desk.error}</ErrorNote>;
  const d = desk.data;
  const rows = d?.[tab] ?? [];
  const overdue = d?.followUps.filter((n) => n.overdue).length ?? 0;

  return (
    <>
      <PageTitle
        title="Renewals & follow-ups"
        sub="Who to contact, and what you promised to come back to."
      >
        <Field
          as="select"
          aria-label="Window"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-44"
        >
          <option value={7}>Next 7 days</option>
          <option value={14}>Next 14 days</option>
          <option value={30}>Next 30 days</option>
        </Field>
      </PageTitle>
      {!d ? (
        <Skeleton rows={6} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <section>
            <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              {BUCKETS.map(([k, l, , tone]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={cx(
                    "rounded-xl border p-3 text-left transition",
                    tab === k
                      ? "border-rose-300 bg-white shadow-sm ring-2 ring-rose-100"
                      : "border-stone-200 bg-white hover:border-stone-300",
                  )}
                >
                  <p className="text-xs text-stone-500">{l}</p>
                  <p className="num mt-0.5 text-2xl font-bold">{d[k].length}</p>
                  <Badge tone={tone}>{k}</Badge>
                </button>
              ))}
            </div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-stone-500">
                {BUCKETS.find((b) => b[0] === tab)[2]}
              </p>
              {rows.length > 0 && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    setMsg({
                      tenantIds: rows.map((r) => r.tenantId),
                      names: rows.map((r) => r.displayName),
                      kind: "RENEWAL",
                    })
                  }
                >
                  <LuSend aria-hidden /> Remind all {rows.length}
                </Button>
              )}
            </div>
            {!rows.length ? (
              <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
                Nobody here right now.
              </p>
            ) : (
              <ul className="space-y-2">
                {rows.map((r) => (
                  <li
                    key={r.tenantId}
                    className="rounded-xl border border-stone-200 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/platform/salons/${r.tenantId}`}
                          className="font-semibold hover:text-rose-700"
                        >
                          {r.displayName}
                        </Link>
                        <p className="text-xs text-stone-500">
                          {r.owner
                            ? `${r.owner.name} · ${
                                r.owner.phone ?? r.owner.email
                              }`
                            : "No owner"}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                          <StateBadge state={r.state} /> {r.plan} · ends{" "}
                          {date(r.periodEnd)}{" "}
                          <span
                            className={cx(
                              "text-xs font-semibold",
                              r.daysLeft < 0
                                ? "text-rose-700"
                                : "text-amber-700",
                            )}
                          >
                            {daysLabel(r.daysLeft)}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {r.lastMessage
                            ? `Last message: ${
                                MESSAGE_KINDS[r.lastMessage.kind] ??
                                r.lastMessage.kind
                              }, ${dateTime(r.lastMessage.createdAt)}`
                            : "Not messaged yet"}
                          {r.nextFollowUp &&
                            ` · Follow-up ${date(r.nextFollowUp.followUpAt)}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.owner?.phone && (
                          <a
                            href={`tel:${r.owner.phone}`}
                            className="rounded-full p-2 text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
                            aria-label={`Call ${r.displayName}`}
                          >
                            <LuPhone />
                          </a>
                        )}
                        {r.owner?.phone && (
                          <a
                            href={wa(r.owner.phone)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full p-2 text-emerald-700 ring-1 ring-stone-200 hover:bg-emerald-50"
                            aria-label={`WhatsApp ${r.displayName}`}
                          >
                            <LuMessageCircle />
                          </a>
                        )}
                        <Button
                          size="sm"
                          onClick={() =>
                            setNote(note === r.tenantId ? null : r.tenantId)
                          }
                        >
                          Log call
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() =>
                            setMsg({
                              tenantIds: [r.tenantId],
                              names: [r.displayName],
                              kind: "RENEWAL",
                            })
                          }
                        >
                          <LuSend aria-hidden /> Remind
                        </Button>
                      </div>
                    </div>
                    {note === r.tenantId && (
                      <div className="mt-3 border-t border-stone-100 pt-3">
                        <NoteComposer
                          tenantId={r.tenantId}
                          compact
                          onAdded={() => {
                            setNote(null);
                            desk.reload();
                          }}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-2 flex items-center gap-2 font-semibold">
              Open follow-ups{" "}
              {overdue > 0 && <Badge tone="rose">{overdue} overdue</Badge>}
            </h2>
            {!d.followUps.length ? (
              <p className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
                No open follow-ups. Add one from a salon’s Notes tab or “Log
                call”.
              </p>
            ) : (
              <ul className="space-y-2">
                {d.followUps.map((n) => (
                  <li
                    key={n.id}
                    className={cx(
                      "rounded-xl border bg-white p-3 text-sm",
                      n.overdue ? "border-rose-200" : "border-stone-200",
                    )}
                  >
                    <p className="flex flex-wrap items-center gap-2">
                      <span
                        className={cx(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          n.overdue
                            ? "bg-rose-50 text-rose-800"
                            : "bg-amber-50 text-amber-800",
                        )}
                      >
                        {n.overdue ? "Overdue · " : ""}
                        {date(n.followUpAt)}
                      </span>
                      <Link
                        to={`/platform/salons/${n.tenant.id}?tab=notes`}
                        className="font-semibold hover:text-rose-700"
                      >
                        {n.tenant.displayName}
                      </Link>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-stone-700">
                      {n.body}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {NOTE_KINDS[n.kind]} by {n.author.name} ·{" "}
                      {dateTime(n.createdAt)}
                    </p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => doneNote(n)}
                    >
                      <LuCheck aria-hidden /> Done
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
      {msg && (
        <MessageComposer
          preset={{
            audience: "selected",
            tenantIds: msg.tenantIds,
            names: msg.names,
          }}
          kind={msg.kind}
          onClose={() => setMsg(null)}
          onSent={desk.reload}
        />
      )}
    </>
  );
}
