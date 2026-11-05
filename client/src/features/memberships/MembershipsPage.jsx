/** Client membership plans (what the salon sells) and the active-member directory. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import {
  Button,
  PageHeader,
  ErrorNote,
  Skeleton,
  Empty,
} from "../../components/ui";
import { useApi } from "../../hooks/useApi.js";
import { PlanCard } from "./components/PlanCard.jsx";
import { NewPlanModal } from "./components/NewPlanModal.jsx";
import { ActiveMembersTable } from "./components/ActiveMembersTable.jsx";

export default function MembershipsPage() {
  const { can, writable } = useAuth();
  const navigate = useNavigate();
  const plans = useApi("/memberships/plans");
  const members = useApi(can("customers.view") ? "/memberships/members" : null);
  const [adding, setAdding] = useState(false);
  const canSell = can("pos.bill") && writable;

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Memberships"
        subtitle="Loyalty plans you sell to clients — discounts, wallet bonus and validity."
        actions={
          can("memberships.manage") &&
          writable && (
            <Button variant="primary" onClick={() => setAdding(true)}>
              New plan
            </Button>
          )
        }
      />
      {plans.error && (
        <ErrorNote onRetry={plans.reload}>{plans.error}</ErrorNote>
      )}
      {plans.loading ? (
        <Skeleton rows={3} />
      ) : !plans.data?.length ? (
        <Empty title="No membership plans yet">
          Create a plan to start selling memberships.
        </Empty>
      ) : (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {plans.data.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              onSell={
                canSell
                  ? () => navigate(`/app/pos/quick?membership=${p.id}`)
                  : null
              }
            />
          ))}
        </div>
      )}
      {members.data && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-stone-700">
            Active members
          </h2>
          <ActiveMembersTable members={members.data} />
        </section>
      )}
      {adding && (
        <NewPlanModal
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            plans.reload();
          }}
        />
      )}
    </div>
  );
}
