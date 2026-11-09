/** Profit & loss: KPIs, charts and the A − B − C statement. Expenses are recorded on the Expenses page. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiPrinter } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { money0, todayISO } from "../../utils/format.js";
import { Button, PageHeader, ErrorNote, Skeleton } from "../../components/ui";
import { Field } from "../../components/forms";
import { KpiCard } from "./components/KpiCard.jsx";
import { MoneyInOutChart } from "./components/MoneyInOutChart.jsx";
import { CostBreakdownChart } from "./components/CostBreakdownChart.jsx";
import { PnlStatement } from "./components/PnlStatement.jsx";
import { printPage } from "../../lib/native.js";

export default function PnlPage() {
  const { can } = useAuth();
  const [range, setRange] = useState({
    from: `${todayISO().slice(0, 7)}-01`,
    to: todayISO(),
  });
  const pnl = useApi(`/pnl?from=${range.from}&to=${range.to}`);
  const d = pnl.data;
  const loss = d && Number(d.netProfit) < 0;

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Profit & loss"
        subtitle="Revenue after discounts, excluding GST and tips, against staff cost and running expenses."
        actions={
          <>
            <div className="flex items-end gap-2">
              <Field
                label="From"
                type="date"
                value={range.from}
                max={range.to}
                onChange={(e) => setRange({ ...range, from: e.target.value })}
              />
              <Field
                label="To"
                type="date"
                value={range.to}
                min={range.from}
                onChange={(e) => setRange({ ...range, to: e.target.value })}
              />
            </div>
            {can("expenses.view") && (
              <Link
                to="/app/expenses"
                className="inline-flex h-10 items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold hover:bg-stone-50"
              >
                Manage expenses
              </Link>
            )}
            <Button onClick={() => printPage("Profit and loss")}>
              <FiPrinter /> Print
            </Button>
          </>
        }
      />
      {pnl.error && <ErrorNote onRetry={pnl.reload}>{pnl.error}</ErrorNote>}
      {pnl.loading || !d ? (
        <Skeleton rows={6} />
      ) : (
        <div className="print-area space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KpiCard
              label="Revenue"
              value={money0(d.revenue.total)}
              note={`${money0(d.revenue.discountsGiven)} discounts given`}
            />
            <KpiCard
              label="Retail sales"
              value={money0(d.revenue.products)}
              note={
                d.productShare === null
                  ? "—"
                  : `${Number(d.productShare).toFixed(1)}% of revenue`
              }
            />
            <KpiCard
              label="Staff cost"
              value={money0(d.staff.total)}
              note={
                d.staff.isEstimate
                  ? "Base pay estimated from salary settings"
                  : "From approved payroll"
              }
            />
            <KpiCard
              label="Running expenses"
              value={money0(d.expenses.total)}
            />
            <KpiCard
              label={loss ? "Net loss" : "Net profit"}
              value={money0(Math.abs(Number(d.netProfit)))}
              note={
                d.marginPercent === null
                  ? "No revenue in period"
                  : `${Number(d.marginPercent).toFixed(1)}% margin`
              }
              tone={loss ? "loss" : "profit"}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-12">
            <MoneyInOutChart pnl={d} />
            <CostBreakdownChart pnl={d} />
          </div>
          <div className="max-w-3xl">
            <PnlStatement pnl={d} range={range} />
          </div>
        </div>
      )}
    </div>
  );
}
