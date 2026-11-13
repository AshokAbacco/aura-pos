import { Link, useSearchParams } from "react-router-dom";
import {
  LuStore,
  LuUser,
  LuUsers,
  LuReceipt,
  LuCreditCard,
} from "react-icons/lu";
import { date, dateTime, money } from "../../../utils/format.js";
import { Badge, ErrorNote, Skeleton } from "../../../components/ui";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { PageTitle } from "../components/PageTitle.jsx";
import { StateBadge } from "../components/StateBadge.jsx";
import { PAYMENT_TONE, ROLE_LABEL } from "../utils/platform.constants.js";

function Group({ icon: Icon, title, count, children }) {
  if (!count) return null;
  return (
    <section className="rounded-xl border border-stone-200 bg-white">
      <h2 className="flex items-center gap-2 border-b border-stone-100 px-4 py-2.5 text-sm font-semibold">
        <Icon className="text-rose-700" aria-hidden /> {title}{" "}
        <span className="text-stone-400">{count}</span>
      </h2>
      <ul className="divide-y divide-stone-100">{children}</ul>
    </section>
  );
}
const Item = ({ to, children }) => (
  <li>
    <Link to={to} className="block px-4 py-2.5 text-sm hover:bg-stone-50">
      {children}
    </Link>
  </li>
);

/** Results of the universal search box: salons, logins, salon customers, invoices and payments. */
export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const r = usePlatformApi(
    q.length >= 2 ? `/search?q=${encodeURIComponent(q)}` : null,
  );
  const d = r.data;
  const total = d
    ? d.tenants.length +
      d.users.length +
      d.customers.length +
      d.invoices.length +
      d.payments.length
    : 0;
  return (
    <>
      <PageTitle
        title={`Results for “${q}”`}
        sub="Matches salon names, owners and staff (name, email, phone), salon customers, invoice numbers and Razorpay ids."
      />
      {q.length < 2 ? (
        <p className="text-sm text-stone-500">
          Type at least 2 characters in the search box.
        </p>
      ) : r.error ? (
        <ErrorNote onRetry={r.reload}>{r.error}</ErrorNote>
      ) : !d ? (
        <Skeleton rows={6} />
      ) : !total ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          Nothing found. Try part of a name, the last digits of a phone number,
          or an invoice number.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Group icon={LuStore} title="Salons" count={d.tenants.length}>
            {d.tenants.map((t) => (
              <Item key={t.id} to={`/platform/salons/${t.id}`}>
                <span className="flex items-center justify-between gap-2">
                  <b>{t.displayName}</b>
                  <span className="flex items-center gap-2 text-xs">
                    {t.plan}
                    <StateBadge state={t.state} />
                  </span>
                </span>
                <span className="text-xs text-stone-500">{t.slug}</span>
              </Item>
            ))}
          </Group>
          <Group
            icon={LuUser}
            title="Salon logins (owners & staff)"
            count={d.users.length}
          >
            {d.users.map((u) => (
              <Item
                key={u.id}
                to={`/platform/salons/${u.tenant.id}/users/${u.id}`}
              >
                <b>{u.name}</b>{" "}
                <span className="text-xs text-stone-500">
                  {ROLE_LABEL[u.role] ?? u.role} at {u.tenant.displayName}
                </span>
                {!u.isActive && <Badge tone="stone"> disabled</Badge>}
                <span className="block text-xs text-stone-500">
                  {u.email}
                  {u.phone ? ` · ${u.phone}` : ""}
                </span>
              </Item>
            ))}
          </Group>
          <Group
            icon={LuUsers}
            title="Salon customers"
            count={d.customers.length}
          >
            {d.customers.map((c) => (
              <Item key={c.id} to={`/platform/salons/${c.tenant.id}`}>
                <b>{c.name}</b>{" "}
                <span className="text-xs text-stone-500">
                  customer of {c.tenant.displayName}
                </span>
                <span className="block text-xs text-stone-500">
                  {c.phone}
                  {c.email ? ` · ${c.email}` : ""}
                </span>
              </Item>
            ))}
          </Group>
          <Group icon={LuReceipt} title="Invoices" count={d.invoices.length}>
            {d.invoices.map((i) => (
              <Item key={i.id} to={`/platform/salons/${i.tenant.id}`}>
                <span className="flex justify-between gap-2">
                  <b className="font-mono">{i.number}</b>
                  <span className="num">{money(i.grandTotal)}</span>
                </span>
                <span className="text-xs text-stone-500">
                  {i.tenant.displayName} · {date(i.issuedAt)} ·{" "}
                  {i.status.toLowerCase()}
                </span>
              </Item>
            ))}
          </Group>
          <Group
            icon={LuCreditCard}
            title="Subscription payments"
            count={d.payments.length}
          >
            {d.payments.map((p) => (
              <Item
                key={p.id}
                to={`/platform/salons/${p.tenant.id}?tab=billing`}
              >
                <span className="flex justify-between gap-2">
                  <b>{p.tenant.displayName}</b>
                  <span className="flex items-center gap-2">
                    <span className="num">{money(p.amount)}</span>
                    <Badge tone={PAYMENT_TONE[p.status]}>{p.status}</Badge>
                  </span>
                </span>
                <span className="font-mono text-xs text-stone-500">
                  {p.providerPaymentId ?? p.providerOrderId} · {p.plan} ·{" "}
                  {dateTime(p.createdAt)}
                </span>
              </Item>
            ))}
          </Group>
        </div>
      )}
    </>
  );
}
