import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "../../../utils/format.js";
import { Badge, ErrorNote, Skeleton } from "../../../components/ui";
import { ChartCard } from "../../../components/charts/ChartCard.jsx";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { STATE_LABEL, STATE_TONE } from "../utils/platform.constants.js";

const monthLabel = (m) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" });
const axis = { fontSize: 11, fill: "#78716c" };

function Kpi({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="num mt-1 text-2xl font-extrabold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

/** Business health of the whole service: salons, money, usage and 12-month trends. */
export function StatsOverview() {
  const s = usePlatformApi("/stats");
  if (s.loading) return <Skeleton rows={4} />;
  if (s.error && !s.data)
    return <ErrorNote onRetry={s.reload}>{s.error}</ErrorNote>;
  const d = s.data;
  const monthly = d.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }));
  const paying = d.byState.ACTIVE ?? 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi
          label="Salons"
          value={d.tenants}
          hint={`${d.newThisMonth} joined this month`}
        />
        <Kpi
          label="Paying salons"
          value={paying}
          hint={`${d.byState.TRIAL ?? 0} on trial`}
        />
        <Kpi
          label="Monthly recurring revenue"
          value={money(d.mrr)}
          hint="Active paid plans, per month"
        />
        <Kpi
          label="Collected this month"
          value={money(d.revenueThisMonth)}
          hint={`${d.paymentsThisMonth} payment${
            d.paymentsThisMonth === 1 ? "" : "s"
          }`}
        />
        <Kpi
          label="Billed by salons (30 days)"
          value={money(d.usage.billedLast30Days)}
          hint={`${d.usage.invoicesLast30Days} invoices`}
        />
        <Kpi
          label="Salons billing (30 days)"
          value={d.usage.salonsBillingLast30Days}
          hint="Made at least one bill"
        />
        <Kpi label="Active users" value={d.usage.activeUsers} />
        <Kpi label="Clients across salons" value={d.usage.clients} />
        <Kpi
          label="Failed webhooks"
          value={d.failedWebhooks}
          hint={d.failedWebhooks ? "Check the Webhooks tab" : "All clear"}
        />
        <Kpi label="New enquiries" value={d.newContacts} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Subscription revenue by month (₹)"
          empty={
            monthly.every((m) => !m.revenue) &&
            "No payments in the last 12 months yet."
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthly}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#f0eeec" />
              <XAxis
                dataKey="label"
                tick={axis}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={axis}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v) =>
                  v >= 1000 ? `${Math.round(v / 1000)}k` : v
                }
              />
              <Tooltip
                formatter={(v) => money(v)}
                labelFormatter={(l, p) => p?.[0]?.payload.month ?? l}
              />
              <Bar
                dataKey="revenue"
                name="Collected"
                fill="#7b2843"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="New salons by month">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthly}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#f0eeec" />
              <XAxis
                dataKey="label"
                tick={axis}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={axis}
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
              />
              <Tooltip labelFormatter={(l, p) => p?.[0]?.payload.month ?? l} />
              <Line
                type="monotone"
                dataKey="signups"
                name="Sign-ups"
                stroke="#7b2843"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-semibold">Salons by access</h2>
          <ul className="space-y-1.5">
            {Object.entries(d.byState)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <li key={k} className="flex items-center justify-between">
                  <Badge tone={STATE_TONE[k]}>{STATE_LABEL[k] ?? k}</Badge>
                  <b className="num">{v}</b>
                </li>
              ))}
          </ul>
        </section>
        <section className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-semibold">Salons by plan</h2>
          {Object.keys(d.byPlan).length ? (
            <ul className="space-y-1.5">
              {Object.entries(d.byPlan)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span>{k}</span>
                    <b className="num">{v}</b>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-stone-500">No subscriptions yet.</p>
          )}
        </section>
        <section className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-semibold">Subscriptions by status</h2>
          <ul className="space-y-1.5">
            {Object.entries(d.subscriptionsByStatus).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span className="text-stone-600">
                  {k.replaceAll("_", " ").toLowerCase()}
                </span>
                <b className="num">{v}</b>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
