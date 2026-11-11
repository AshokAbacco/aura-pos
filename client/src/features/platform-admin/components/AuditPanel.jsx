import { useState } from "react";
import { dateTime } from "../../../utils/format.js";
import { Button, ErrorNote, Skeleton } from "../../../components/ui";
import { Field } from "../../../components/forms";
import { DataTable } from "../../../components/tables";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { AUDIT_FILTERS } from "../utils/platform.constants.js";

const PAGE = 50;
const short = (detail) => {
  if (!detail || typeof detail !== "object") return "";
  const s = Object.entries(detail)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" · ");
  return s.length > 140 ? `${s.slice(0, 140)}…` : s;
};

/** Everything audited across the service: who did what, when, to which salon. */
export function AuditPanel() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE),
    ...(action ? { action } : {}),
  });
  const list = usePlatformApi(`/audit?${params}`);
  const total = list.meta?.total ?? 0;
  const columns = [
    {
      key: "createdAt",
      header: "When",
      render: (r) => (
        <span className="whitespace-nowrap text-xs">
          {dateTime(r.createdAt)}
        </span>
      ),
    },
    {
      key: "tenant",
      header: "Salon",
      render: (r) =>
        r.tenant?.displayName ?? (
          <span className="text-stone-400">Platform</span>
        ),
    },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
          {r.action}
        </code>
      ),
    },
    {
      key: "actor",
      header: "By",
      render: (r) => (
        <span className="text-xs text-stone-600">{r.actor.split(":")[0]}</span>
      ),
    },
    {
      key: "detail",
      header: "Details",
      render: (r) => (
        <span className="text-xs text-stone-600">{short(r.detail)}</span>
      ),
    },
  ];
  return (
    <div className="space-y-3">
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
      {list.error && <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>}
      {list.loading ? (
        <Skeleton />
      ) : (
        list.data && (
          <DataTable
            columns={columns}
            rows={list.data}
            minWidth={900}
            empty="Nothing logged yet."
          />
        )
      )}
      {total > PAGE && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Newer
          </Button>
          <span>
            Page {page} of {Math.ceil(total / PAGE)}
          </span>
          <Button
            size="sm"
            disabled={page * PAGE >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Older
          </Button>
        </div>
      )}
    </div>
  );
}
