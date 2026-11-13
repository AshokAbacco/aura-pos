import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LuSend, LuX, LuBellRing, LuChevronRight } from "react-icons/lu";
import { date, dateTime, money } from "../../../utils/format.js";
import { Button, ErrorNote, Skeleton } from "../../../components/ui";
import { Field } from "../../../components/forms";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { PageTitle } from "../components/PageTitle.jsx";
import { StateBadge } from "../components/StateBadge.jsx";
import { MessageComposer } from "../components/MessageComposer.jsx";
import {
  STATE_LABEL,
  SALON_SORTS,
  daysLabel,
} from "../utils/platform.constants.js";
import { cx } from "../../../utils/cx.js";

const PAGE = 50;
const FILTER_KEYS = [
  "q",
  "state",
  "planId",
  "expiresWithin",
  "followUp",
  "joinedFrom",
  "joinedTo",
  "sort",
];

/** Every salon with owner, plan, access, usage and follow-ups. Filters live in the URL so a view can be shared. */
export default function SalonsPage() {
  const [params, setParams] = useSearchParams();
  const f = Object.fromEntries(
    FILTER_KEYS.map((k) => [k, params.get(k) ?? ""]),
  );
  const page = Number(params.get("page") ?? 1);
  const [q, setQ] = useState(f.q);
  const [selected, setSelected] = useState(new Set());
  const [composer, setComposer] = useState(false);
  const plans = usePlatformApi("/plans");

  const setFilter = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    next.delete("page");
    setParams(next, { replace: true });
  };
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== f.q) setFilter("q", q.trim());
    }, 350);
    return () => clearTimeout(t);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE),
  });
  FILTER_KEYS.forEach((k) => f[k] && query.set(k, f[k]));
  const list = usePlatformApi(`/salons?${query}`);
  const total = list.meta?.total ?? 0;
  const rows = useMemo(() => list.data ?? [], [list.data]);
  const active = FILTER_KEYS.filter((k) => k !== "sort" && f[k]).length;

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const names = rows
    .filter((r) => selected.has(r.id))
    .map((r) => r.displayName);

  return (
    <>
      <PageTitle
        title="Salons"
        sub={`${total} salon${total === 1 ? "" : "s"}${
          active ? " match these filters" : " in total"
        }`}
      >
        <Button onClick={() => setComposer("segment")}>
          <LuSend aria-hidden /> Message salons
        </Button>
      </PageTitle>

      {/* Filters */}
      <div className="mb-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]">
        <Field
          label="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Salon, owner, email, phone, GSTIN"
        />
        <Field
          as="select"
          label="Access"
          value={f.state}
          onChange={(e) => setFilter("state", e.target.value)}
        >
          <option value="">All</option>
          {Object.entries(STATE_LABEL).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </Field>
        <Field
          as="select"
          label="Plan"
          value={f.planId}
          onChange={(e) => setFilter("planId", e.target.value)}
        >
          <option value="">All plans</option>
          {(plans.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Field>
        <Field
          as="select"
          label="Plan ends"
          value={f.expiresWithin}
          onChange={(e) => setFilter("expiresWithin", e.target.value)}
        >
          <option value="">Any time</option>
          <option value="3">Within 3 days</option>
          <option value="7">Within 7 days</option>
          <option value="15">Within 15 days</option>
          <option value="30">Within 30 days</option>
        </Field>
        <Field
          as="select"
          label="Follow-ups"
          value={f.followUp}
          onChange={(e) => setFilter("followUp", e.target.value)}
        >
          <option value="">Any</option>
          <option value="due">Due today / overdue</option>
          <option value="open">Has open follow-up</option>
        </Field>
        <Field
          as="select"
          label="Sort"
          value={f.sort || "newest"}
          onChange={(e) =>
            setFilter("sort", e.target.value === "newest" ? "" : e.target.value)
          }
        >
          {SALON_SORTS.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </Field>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-6">
          <Field
            type="date"
            label="Joined from"
            value={f.joinedFrom}
            onChange={(e) => setFilter("joinedFrom", e.target.value)}
            className="w-40"
          />
          <Field
            type="date"
            label="Joined to"
            value={f.joinedTo}
            onChange={(e) => setFilter("joinedTo", e.target.value)}
            className="w-40"
          />
          {active > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setQ("");
                setParams({}, { replace: true });
              }}
            >
              <LuX aria-hidden /> Clear {active} filter{active === 1 ? "" : "s"}
            </Button>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-stone-900 px-4 py-2.5 text-sm text-white shadow-lg">
          <b>{selected.size} selected</b>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setComposer("selected")}
          >
            <LuSend aria-hidden /> Send message
          </Button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-stone-300 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {list.error && <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>}
      {list.loading ? (
        <Skeleton rows={6} />
      ) : !rows.length ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">
          No salons match.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-stone-50 text-left text-xs text-stone-500">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allOnPage}
                    onChange={() =>
                      setSelected((s) => {
                        const n = new Set(s);
                        rows.forEach((r) =>
                          allOnPage ? n.delete(r.id) : n.add(r.id),
                        );
                        return n;
                      })
                    }
                    className="h-4 w-4 accent-rose-700"
                  />
                </th>
                <th className="px-3 py-2 font-semibold">Salon & owner</th>
                <th className="px-3 py-2 font-semibold">Plan & access</th>
                <th className="px-3 py-2 font-semibold">Plan ends</th>
                <th className="px-3 py-2 font-semibold">Usage</th>
                <th className="px-3 py-2 text-right font-semibold">
                  Billed 30 days
                </th>
                <th className="px-3 py-2 font-semibold">Last active</th>
                <th className="px-3 py-2 font-semibold">Joined</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((t) => (
                <tr
                  key={t.id}
                  className={cx(
                    "hover:bg-stone-50",
                    selected.has(t.id) && "bg-rose-50/40",
                  )}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Select ${t.displayName}`}
                      checked={selected.has(t.id)}
                      onChange={() => toggle(t.id)}
                      className="h-4 w-4 accent-rose-700"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      to={`/platform/salons/${t.id}`}
                      className="font-semibold text-stone-900 hover:text-rose-700"
                    >
                      {t.displayName}
                    </Link>
                    {t.openFollowUps > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                        <LuBellRing size={11} aria-hidden />
                        {t.openFollowUps}
                      </span>
                    )}
                    {t.owner && (
                      <span className="block text-xs text-stone-500">
                        {t.owner.name} · {t.owner.email}
                        {t.owner.phone ? ` · ${t.owner.phone}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="block">{t.plan ?? "—"}</span>
                    <StateBadge state={t.effectiveState} />
                  </td>
                  <td className="px-3 py-2.5">
                    {t.periodEnd ? (
                      <>
                        <span className="block">{date(t.periodEnd)}</span>
                        <span
                          className={cx(
                            "text-xs",
                            t.daysLeft < 0
                              ? "text-rose-700"
                              : t.daysLeft <= 7
                              ? "text-amber-700"
                              : "text-stone-500",
                          )}
                        >
                          {daysLabel(t.daysLeft)}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-stone-600">
                    {t.branches} branch{t.branches === 1 ? "" : "es"} ·{" "}
                    {t.users} user{t.users === 1 ? "" : "s"}
                    <br />
                    {t.clients} clients · {t.invoices} bills
                  </td>
                  <td className="num px-3 py-2.5 text-right">
                    {money(t.billed30)}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {t.lastActivityAt ? dateTime(t.lastActivityAt) : "Never"}
                  </td>
                  <td className="px-3 py-2.5 text-xs">{date(t.createdAt)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      to={`/platform/salons/${t.id}`}
                      aria-label={`Open ${t.displayName}`}
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
      {total > PAGE && (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          <Button
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const n = new URLSearchParams(params);
              n.set("page", String(page - 1));
              setParams(n);
            }}
          >
            Previous
          </Button>
          <span>
            Page {page} of {Math.ceil(total / PAGE)}
          </span>
          <Button
            size="sm"
            disabled={page * PAGE >= total}
            onClick={() => {
              const n = new URLSearchParams(params);
              n.set("page", String(page + 1));
              setParams(n);
            }}
          >
            Next
          </Button>
        </div>
      )}

      {composer === "selected" && (
        <MessageComposer
          preset={{ audience: "selected", tenantIds: [...selected], names }}
          kind="CUSTOM"
          onClose={() => setComposer(false)}
          onSent={() => setSelected(new Set())}
        />
      )}
      {composer === "segment" && (
        <MessageComposer onClose={() => setComposer(false)} />
      )}
    </>
  );
}
