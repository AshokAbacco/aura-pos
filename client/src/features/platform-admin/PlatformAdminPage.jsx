/**
 * Platform Super Admin (/platform): the people who run the Salora Glam service.
 * Separate login, token and cookie from salon accounts; every route is also checked on the server.
 */
import { useState } from "react";
import { FiLogOut } from "react-icons/fi";
import { cx } from "../../utils/cx.js";
import { Button, Skeleton } from "../../components/ui";
import { usePlatformSession } from "./hooks/usePlatformSession.js";
import { AdminLogin } from "./components/AdminLogin.jsx";
import { StatsOverview } from "./components/StatsOverview.jsx";
import { TenantsPanel } from "./components/TenantsPanel.jsx";
import { PlansPanel } from "./components/PlansPanel.jsx";
import { PaymentsPanel } from "./components/PaymentsPanel.jsx";
import { WebhooksPanel } from "./components/WebhooksPanel.jsx";
import { ContactsPanel } from "./components/ContactsPanel.jsx";
import { AuditPanel } from "./components/AuditPanel.jsx";
import { BrandLogo } from "../../components/ui/BrandLogo.jsx";
import { TABS } from "./utils/platform.constants.js";

const PANELS = {
  overview: StatsOverview,
  tenants: TenantsPanel,
  plans: PlansPanel,
  payments: PaymentsPanel,
  webhooks: WebhooksPanel,
  contacts: ContactsPanel,
  audit: AuditPanel,
};

export default function PlatformAdminPage() {
  const { status, login, logout } = usePlatformSession();
  const [tab, setTab] = useState("overview");
  if (status === "checking")
    return (
      <div className="p-6">
        <Skeleton rows={4} />
      </div>
    );
  if (status === "out") return <AdminLogin onLogin={login} />;
  const Panel = PANELS[tab];
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="flex items-center justify-between gap-3 bg-stone-900 px-4 py-3 text-white md:px-6">
        <p className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="rounded-md bg-cream p-0.5">
            <BrandLogo variant="mark" className="h-8" alt="" />
          </span>
          Salora Glam{" "}
          <span className="font-sans text-sm font-normal text-stone-400">
            platform admin
          </span>
        </p>
        <Button size="sm" onClick={logout}>
          <FiLogOut /> Sign out
        </Button>
      </header>
      <nav
        className="flex gap-1 overflow-x-auto border-b border-stone-200 bg-white px-4 md:px-6"
        role="tablist"
      >
        {TABS.map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cx(
              "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold",
              tab === k
                ? "border-rose-700 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800",
            )}
          >
            {l}
          </button>
        ))}
      </nav>
      <main className="p-4 md:p-6">
        <Panel />
      </main>
    </div>
  );
}
