import { useState } from "react";
import { money } from "../../../utils/format.js";
import { Badge, Button, ErrorNote, Skeleton } from "../../../components/ui";
import { DataTable } from "../../../components/tables";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { PlanModal } from "./PlanModal.jsx";
import { usePlatform } from "../hooks/usePlatformSession.js";

export function PlansPanel() {
  const plans = usePlatformApi("/plans");
  const { isSuper } = usePlatform(); // only super admins change plans
  const [edit, setEdit] = useState(null); // null | 'new' | plan
  const columns = [
    {
      key: "name",
      header: "Plan",
      render: (p) => (
        <>
          <b>{p.name}</b>
          <span className="block text-xs text-stone-500">{p.code}</span>
        </>
      ),
    },
    { key: "interval", header: "Interval" },
    {
      key: "price",
      header: "Price",
      align: "right",
      render: (p) => money(p.price),
    },
    {
      key: "limits",
      header: "Limits",
      render: (p) =>
        `${p.maxStaff} staff · ${p.maxBranches} branch${
          p.maxBranches > 1 ? "es" : ""
        }`,
    },
    {
      key: "flags",
      header: "Status",
      render: (p) => (
        <span className="flex gap-1">
          {p.isActive ? (
            <Badge tone="green">On sale</Badge>
          ) : (
            <Badge>Off</Badge>
          )}
          {p.isPublic && <Badge tone="blue">Public</Badge>}
        </span>
      ),
    },
    {
      key: "a",
      header: "",
      align: "right",
      render: (p) =>
        isSuper && (
          <Button size="sm" variant="ghost" onClick={() => setEdit(p)}>
            Edit
          </Button>
        ),
    },
  ];
  return (
    <div className="space-y-3">
      {isSuper && (
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => setEdit("new")}>
            New plan
          </Button>
        </div>
      )}
      {plans.error ? (
        <ErrorNote onRetry={plans.reload}>{plans.error}</ErrorNote>
      ) : plans.loading ? (
        <Skeleton />
      ) : (
        <DataTable columns={columns} rows={plans.data} minWidth={720} />
      )}
      {edit && (
        <PlanModal
          plan={edit === "new" ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            plans.reload();
          }}
        />
      )}
    </div>
  );
}
