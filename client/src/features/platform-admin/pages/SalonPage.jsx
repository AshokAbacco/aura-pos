import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  LuArrowLeft,
  LuPhone,
  LuMail,
  LuMessageCircle,
  LuSend,
  LuCalendarPlus,
  LuBan,
  LuRotateCcw,
  LuArrowUpDown,
  LuCheck,
  LuChevronRight,
} from "react-icons/lu";
import { errorMessage } from "../../../lib/api.js";
import { date, dateTime, money } from "../../../utils/format.js";
import { useToast } from "../../../contexts/ToastContext.jsx";
import { Badge, Button, ErrorNote, Skeleton } from "../../../components/ui";
import { Field } from "../../../components/forms";
import { Modal, ConfirmDialog } from "../../../components/modals";
import { cx } from "../../../utils/cx.js";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { usePlatform } from "../hooks/usePlatformSession.js";
import { platformApi } from "../utils/platformApi.js";
import { PageTitle } from "../components/PageTitle.jsx";
import { StateBadge } from "../components/StateBadge.jsx";
import { MessageComposer } from "../components/MessageComposer.jsx";
import { NoteComposer } from "../components/NoteComposer.jsx";
import { ActivityList } from "../components/ActivityList.jsx";
import {
  NOTE_KINDS,
  PAYMENT_TONE,
  ROLE_LABEL,
  MESSAGE_KINDS,
  daysLabel,
} from "../utils/platform.constants.js";

const TABS = [
  ["overview", "Overview"],
  ["team", "Team"],
  ["branches", "Branches"],
  ["billing", "Plan & payments"],
  ["activity", "Activity"],
  ["notes", "Notes & follow-ups"],
  ["messages", "Messages"],
];
const wa = (phone) =>
  `https://wa.me/${String(phone)
    .replace(/\D/g, "")
    .replace(/^(\d{10})$/, "91$1")}`;

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="num mt-1 text-xl font-bold">{value}</p>
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
    </div>
  );
}
function Card({ title, children, action }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white">
      <header className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** One salon, everything support needs: owner contact, plan, usage, team, branches, payments, activity, notes. */
export default function SalonPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "overview";
  const { isSuper } = usePlatform();
  const toast = useToast();
  const t = usePlatformApi(`/tenants/${id}`);
  const notes = usePlatformApi(`/tenants/${id}/notes`);
  const plans = usePlatformApi(isSuper ? "/plans" : null);
  const messages = usePlatformApi(
    tab === "messages" ? `/messages?tenantId=${id}` : null,
  );
  const [action, setAction] = useState(null);
  const [days, setDays] = useState(30);
  const [planId, setPlanId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (t.error && !t.data)
    return <ErrorNote onRetry={t.reload}>{t.error}</ErrorNote>;
  if (!t.data) return <Skeleton rows={6} />;
  const d = t.data;
  const sub = d.subscriptions[0];
  const owner = d.users.find((u) => u.role === "OWNER");
  const daysLeft = sub
    ? Math.ceil((new Date(sub.currentPeriodEnd) - Date.now()) / 86400000)
    : null;
  const openNotes = (notes.data ?? [])
    .filter((n) => n.status === "OPEN" && n.followUpAt)
    .sort((a, b) => new Date(a.followUpAt) - new Date(b.followUpAt));

  const done = (msg) => {
    toast(msg);
    setAction(null);
    setReason("");
    t.reload();
  };
  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  const submitPlan = (e) => {
    e.preventDefault();
    run(async () => {
      if (action === "extend") {
        const r = await platformApi.post(`/tenants/${id}/extend`, {
          days: Number(days),
          reason,
        });
        done(`Extended to ${date(r.data.data.currentPeriodEnd)}`);
      }
      if (action === "plan") {
        const r = await platformApi.post(`/tenants/${id}/plan`, {
          planId,
          reason,
        });
        done(`Moved to ${r.data.data.plan}`);
      }
    });
  };
  const setNote = (n, data) =>
    run(async () => {
      await platformApi.patch(`/notes/${n.id}`, data);
      notes.reload();
    });

  return (
    <>
      <Link
        to="/platform/salons"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
      >
        <LuArrowLeft aria-hidden /> All salons
      </Link>
      <PageTitle
        title={d.displayName}
        sub={`${d.legalName !== d.displayName ? `${d.legalName} · ` : ""}${
          d.slug
        } · joined ${date(d.createdAt)}${d.gstin ? ` · GSTIN ${d.gstin}` : ""}`}
      >
        <Button onClick={() => setAction("message")}>
          <LuSend aria-hidden /> Message
        </Button>
        <Button onClick={() => setParams({ tab: "notes" })}>
          <LuCalendarPlus aria-hidden /> Note / follow-up
        </Button>
        {isSuper && (
          <>
            <Button disabled={!sub} onClick={() => setAction("extend")}>
              <LuCalendarPlus aria-hidden /> Extend
            </Button>
            <Button
              disabled={!sub}
              onClick={() => {
                setPlanId(sub?.planId ?? "");
                setAction("plan");
              }}
            >
              <LuArrowUpDown aria-hidden /> Change plan
            </Button>
            {d.status === "SUSPENDED" ? (
              <Button variant="primary" onClick={() => setAction("reactivate")}>
                <LuRotateCcw aria-hidden /> Reactivate
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="text-rose-700"
                onClick={() => setAction("suspend")}
              >
                <LuBan aria-hidden /> Suspend
              </Button>
            )}
          </>
        )}
      </PageTitle>

      {/* Status strip */}
      <div className="mb-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm">
          <span className="flex items-center gap-2">
            <StateBadge state={d.effectiveState} />
            <b>{sub?.plan.name ?? "No plan"}</b>
          </span>
          {sub && (
            <span>
              {sub.status === "TRIAL" ? "Trial ends" : "Paid until"}{" "}
              <b>{date(sub.currentPeriodEnd)}</b>{" "}
              <span
                className={cx(
                  "text-xs",
                  daysLeft < 0
                    ? "text-rose-700"
                    : daysLeft <= 7
                    ? "text-amber-700"
                    : "text-stone-500",
                )}
              >
                ({daysLabel(daysLeft)})
              </span>
            </span>
          )}
          {openNotes.length > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
              {openNotes.length} open follow-up
              {openNotes.length === 1 ? "" : "s"} · next{" "}
              {date(openNotes[0].followUpAt)}
            </span>
          )}
          {d.accessReason && (
            <span className="w-full text-xs text-stone-500">
              {d.accessReason}
            </span>
          )}
          {d.status === "SUSPENDED" && (
            <span className="w-full text-xs font-medium text-rose-700">
              Suspended: {d.suspendedReason ?? "no reason recorded"}
            </span>
          )}
        </div>
        {owner && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm">
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-stone-500">Owner</span>
              <b>{owner.name}</b>
              <span className="block truncate text-xs text-stone-500">
                {owner.email}
                {owner.phone ? ` · ${owner.phone}` : ""}
              </span>
            </span>
            {owner.phone && (
              <a
                href={`tel:${owner.phone}`}
                className="rounded-full p-2 text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
                aria-label="Call owner"
                title="Call"
              >
                <LuPhone />
              </a>
            )}
            {owner.phone && (
              <a
                href={wa(owner.phone)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full p-2 text-emerald-700 ring-1 ring-stone-200 hover:bg-emerald-50"
                aria-label="WhatsApp owner"
                title="WhatsApp"
              >
                <LuMessageCircle />
              </a>
            )}
            <a
              href={`mailto:${owner.email}`}
              className="rounded-full p-2 text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
              aria-label="Email owner"
              title="Email"
            >
              <LuMail />
            </a>
          </div>
        )}
      </div>

      <nav
        className="mb-4 flex gap-1 overflow-x-auto border-b border-stone-200"
        role="tablist"
      >
        {TABS.map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() =>
              setParams(k === "overview" ? {} : { tab: k }, { replace: true })
            }
            className={cx(
              "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold",
              tab === k
                ? "border-rose-700 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800",
            )}
          >
            {l}
            {k === "notes" && openNotes.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-[11px] text-amber-800">
                {openNotes.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label="Billed, last 30 days"
              value={money(d.usage.billedLast30Days)}
              hint={`${d.usage.invoicesLast30Days} bills`}
            />
            <Stat
              label="Billed, all time"
              value={money(d.usage.billedAllTime)}
              hint={`${d.usage.invoicesAllTime} bills`}
            />
            <Stat label="Clients" value={d.usage.clients} />
            <Stat
              label="Appointments, 30 days"
              value={d.usage.appointmentsLast30Days}
            />
            <Stat
              label="Staff"
              value={d.usage.staff}
              hint={`${d.users.length} logins`}
            />
            <Stat label="Services & products" value={d.usage.catalogItems} />
            <Stat
              label="Last bill"
              value={
                d.usage.lastInvoiceAt ? date(d.usage.lastInvoiceAt) : "Never"
              }
            />
            <Stat
              label="Last activity"
              value={
                d.usage.lastActivityAt ? date(d.usage.lastActivityAt) : "Never"
              }
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              title="Latest notes"
              action={
                <button
                  onClick={() => setParams({ tab: "notes" })}
                  className="text-sm font-semibold text-rose-700"
                >
                  All notes
                </button>
              }
            >
              {(notes.data ?? []).slice(0, 4).map((n) => (
                <NoteRow key={n.id} n={n} />
              ))}
              {!notes.data?.length && (
                <p className="text-sm text-stone-500">No notes yet.</p>
              )}
            </Card>
            <Card
              title="Recent activity"
              action={
                <button
                  onClick={() => setParams({ tab: "activity" })}
                  className="text-sm font-semibold text-rose-700"
                >
                  Full log
                </button>
              }
            >
              <ActivityList tenantId={id} pageSize={6} compact />
            </Card>
          </div>
        </div>
      )}

      {tab === "team" && (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-stone-50 text-left text-xs text-stone-500">
              <tr>
                <th className="px-4 py-2">Person</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Last sign-in</th>
                <th className="px-4 py-2">Added</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {d.users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/platform/salons/${id}/users/${u.id}`}
                      className="font-semibold hover:text-rose-700"
                    >
                      {u.name}
                    </Link>
                    {!u.isActive && <Badge tone="stone"> disabled</Badge>}
                    <span className="block text-xs text-stone-500">
                      {u.email}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {ROLE_LABEL[u.role] ?? u.role}
                  </td>
                  <td className="px-4 py-2.5">{u.phone ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {u.lastLoginAt ? dateTime(u.lastLoginAt) : "Never"}
                  </td>
                  <td className="px-4 py-2.5 text-xs">{date(u.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      to={`/platform/salons/${id}/users/${u.id}`}
                      aria-label={`Open ${u.name}`}
                      className="inline-flex rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
                    >
                      <LuChevronRight />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "branches" && (
        <div className="grid gap-3 md:grid-cols-2">
          {d.branches.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-stone-200 bg-white p-4 text-sm"
            >
              <p className="flex items-center gap-2 font-semibold">
                {b.name}{" "}
                <span className="text-xs font-normal text-stone-500">
                  {b.code}
                </span>
                {!b.isActive && <Badge tone="stone">closed</Badge>}
              </p>
              <p className="mt-1 text-stone-600">{b.address ?? "No address"}</p>
              <p className="text-stone-600">{b.phone ?? ""}</p>
              <p className="mt-2 text-xs text-stone-500">
                {b._count.resources} chairs / rooms
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "billing" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Subscription history">
            <ul className="max-h-[28rem] divide-y divide-stone-100 overflow-y-auto text-sm">
              {d.subscriptions
                .flatMap((s) =>
                  s.events.map((ev) => ({ ...ev, plan: s.plan.name })),
                )
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((ev) => (
                  <li key={ev.id} className="py-2">
                    <p>
                      <b>{ev.type.replaceAll("_", " ").toLowerCase()}</b>{" "}
                      <span className="text-xs text-stone-500">
                        {ev.plan} · {ev.fromStatus ?? "—"} → {ev.toStatus}
                      </span>
                    </p>
                    <p className="text-xs text-stone-500">
                      {dateTime(ev.createdAt)}
                      {ev.detail?.reason ? ` · “${ev.detail.reason}”` : ""}
                    </p>
                  </li>
                ))}
            </ul>
          </Card>
          <Card title="Payments">
            {d.payments.length ? (
              <ul className="divide-y divide-stone-100 text-sm">
                {d.payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <span>
                      <span className="block">
                        {dateTime(p.createdAt)} · {p.plan?.name ?? "—"}
                      </span>
                      <span className="font-mono text-[11px] text-stone-500">
                        {p.providerPaymentId ?? p.providerOrderId}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <b className="num">{money(p.amount)}</b>
                      <Badge tone={PAYMENT_TONE[p.status]}>{p.status}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">No payments yet.</p>
            )}
          </Card>
        </div>
      )}

      {tab === "activity" && (
        <ActivityList tenantId={id} pageSize={50} filters />
      )}

      {tab === "notes" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="mb-2 font-semibold">Add a note or follow-up</h2>
            <NoteComposer tenantId={id} onAdded={notes.reload} />
          </div>
          <div>
            <h2 className="mb-2 font-semibold">History</h2>
            {notes.loading ? (
              <Skeleton />
            ) : !notes.data?.length ? (
              <p className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
                No notes yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {notes.data.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-xl border border-stone-200 bg-white p-3"
                  >
                    <NoteRow n={n} />
                    {n.followUpAt && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {n.status === "OPEN" ? (
                          <Button
                            size="sm"
                            onClick={() => setNote(n, { status: "DONE" })}
                          >
                            <LuCheck aria-hidden /> Mark done
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setNote(n, { status: "OPEN" })}
                          >
                            Reopen
                          </Button>
                        )}
                        {n.status === "OPEN" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const d2 = new Date();
                              d2.setDate(d2.getDate() + 3);
                              setNote(n, { followUpAt: d2.toISOString() });
                            }}
                          >
                            Snooze 3 days
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "messages" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setAction("message")}>
              <LuSend aria-hidden /> New message
            </Button>
          </div>
          {messages.loading ? (
            <Skeleton />
          ) : !messages.data?.length ? (
            <p className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
              No messages sent to this salon yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {messages.data.map((m) => (
                <li
                  key={m.batchId}
                  className="rounded-xl border border-stone-200 bg-white p-3 text-sm"
                >
                  <p className="flex flex-wrap items-center gap-2">
                    <Badge tone="blue">{MESSAGE_KINDS[m.kind] ?? m.kind}</Badge>
                    <b>{m.title}</b>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-stone-600">
                    {m.body}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {dateTime(m.sentAt)} · by {m.by}
                    {m.recipients > 1
                      ? ` · sent to ${m.recipients} salons`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {action === "message" && (
        <MessageComposer
          preset={{
            audience: "selected",
            tenantIds: [id],
            names: [d.displayName],
          }}
          kind={daysLeft !== null && daysLeft <= 15 ? "RENEWAL" : "CUSTOM"}
          onClose={() => setAction(null)}
          onSent={() => messages.reload()}
        />
      )}
      {(action === "extend" || action === "plan") && (
        <Modal
          open
          onClose={() => setAction(null)}
          title={
            action === "extend" ? "Extend the current period" : "Change plan"
          }
          description="Recorded in the subscription history and the activity log."
        >
          <form onSubmit={submitPlan} className="space-y-3">
            {action === "extend" ? (
              <Field
                type="number"
                min={1}
                max={366}
                label="Days to add"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                hint={
                  sub
                    ? `New end: ${date(
                        new Date(
                          Math.max(Date.now(), new Date(sub.currentPeriodEnd)) +
                            Number(days || 0) * 86400000,
                        ),
                      )}`
                    : undefined
                }
              />
            ) : (
              <Field
                as="select"
                label="New plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
              >
                {(plans.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {money(p.price)}/{p.interval.toLowerCase()}
                    {p.isActive ? "" : " (inactive)"}
                  </option>
                ))}
              </Field>
            )}
            <Field
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                action === "extend"
                  ? "Paid by bank transfer, ref 1234"
                  : "Customize deal agreed on call"
              }
            />
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setAction(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={busy}
                disabled={reason.trim().length < 5}
              >
                {action === "extend" ? `Add ${days} days` : "Change plan"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {(action === "suspend" || action === "reactivate") && (
        <ConfirmDialog
          danger={action === "suspend"}
          minReason={5}
          reasonLabel="Reason (kept in the activity log)"
          reasonPlaceholder="Chargeback under review"
          title={`${action === "suspend" ? "Suspend" : "Reactivate"} ${
            d.displayName
          }?`}
          description={
            action === "suspend"
              ? "Their staff are signed out and the salon can no longer bill. A payment does not lift a suspension."
              : "Access returns according to their current subscription."
          }
          confirmLabel={action === "suspend" ? "Suspend salon" : "Reactivate"}
          onConfirm={(why) =>
            run(async () => {
              await platformApi.post(`/tenants/${id}/${action}`, {
                reason: why,
              });
              done(
                action === "suspend" ? "Salon suspended" : "Salon reactivated",
              );
            })
          }
          onClose={() => setAction(null)}
        />
      )}
    </>
  );
}

function NoteRow({ n }) {
  return (
    <div className="py-1.5 text-sm">
      <p className="flex flex-wrap items-center gap-2">
        <Badge tone={n.kind === "ISSUE" ? "rose" : "stone"}>
          {NOTE_KINDS[n.kind] ?? n.kind}
        </Badge>
        <span className="text-xs text-stone-500">
          {dateTime(n.createdAt)} · {n.author?.name}
        </span>
        {n.followUpAt && (
          <span
            className={cx(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
              n.status === "DONE"
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : new Date(n.followUpAt) < new Date()
                ? "bg-rose-50 text-rose-800 ring-rose-200"
                : "bg-amber-50 text-amber-800 ring-amber-200",
            )}
          >
            {n.status === "DONE" ? "Done" : `Follow up ${date(n.followUpAt)}`}
          </span>
        )}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-stone-700">{n.body}</p>
    </div>
  );
}
