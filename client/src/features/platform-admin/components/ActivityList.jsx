import { useState } from "react";
import { dateTime } from "../../../utils/format.js";
import { Button, ErrorNote, Skeleton } from "../../../components/ui";
import { Field } from "../../../components/forms";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { AUDIT_FILTERS } from "../utils/platform.constants.js";

/** Plain-language label for an audited action, e.g. "invoice.void" → "Invoice void". */
export const actionLabel = (a) =>
  a.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const short = (detail) => {
  if (!detail || typeof detail !== "object") return "";
  const s = Object.entries(detail)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" · ");
  return s.length > 160 ? `${s.slice(0, 160)}…` : s;
};

/** A salon's activity log (optionally one person's), newest first, with paging and type filter. */
export function ActivityList({
  tenantId,
  userId,
  pageSize = 50,
  filters,
  compact,
}) {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const q = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(action ? { action } : {}),
    ...(userId ? { userId } : {}),
  });
  const list = usePlatformApi(`/tenants/${tenantId}/activity?${q}`);
  const total = list.meta?.total ?? 0;
  return (
    <div className="space-y-3">
      {filters && (
        <div className="flex flex-wrap items-end gap-3">
          <Field
            as="select"
            label="Show"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="w-60"
          >
            {AUDIT_FILTERS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Field>
          <p className="pb-2 text-sm text-stone-500">
            {total} entr{total === 1 ? "y" : "ies"}
          </p>
        </div>
      )}
      {list.error && <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>}
      {list.loading ? (
        <Skeleton rows={compact ? 3 : 6} />
      ) : !list.data?.length ? (
        <p className="text-sm text-stone-500">Nothing recorded yet.</p>
      ) : (
        <ol
          className={
            compact
              ? "space-y-2"
              : "divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white"
          }
        >
          {list.data.map((r) => (
            <li
              key={r.id}
              className={compact ? "text-sm" : "px-4 py-2.5 text-sm"}
            >
              <p className="flex flex-wrap items-baseline gap-x-2">
                <b>{actionLabel(r.action)}</b>
                <span className="text-xs text-stone-500">
                  {dateTime(r.createdAt)} · {r.actorName}
                </span>
              </p>
              {!compact && r.detail && (
                <p className="mt-0.5 break-words text-xs text-stone-500">
                  {short(r.detail)}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
      {!compact && total > pageSize && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Newer
          </Button>
          <span>
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          <Button
            size="sm"
            disabled={page * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Older
          </Button>
        </div>
      )}
    </div>
  );
}
