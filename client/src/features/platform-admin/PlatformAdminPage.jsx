/**
 * Platform admin (/platform): the people who run Salora Glam and its customer support team.
 * Separate login, token and cookie from salon accounts; every route is also checked on the server.
 * Super admins can change money and access; Support sees everything, keeps notes and messages salons.
 */
import { Suspense, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuStore,
  LuBellRing,
  LuSend,
  LuSearch,
  LuTags,
  LuCreditCard,
  LuWebhook,
  LuInbox,
  LuHistory,
  LuUsers,
  LuSettings,
  LuLogOut,
  LuMenu,
  LuX,
} from "react-icons/lu";
import { Skeleton } from "../../components/ui";
import { ErrorBoundary } from "../../components/ui/ErrorBoundary.jsx";
import { BrandLogo } from "../../components/ui/BrandLogo.jsx";
import { cx } from "../../utils/cx.js";
import {
  usePlatformSession,
  PlatformContext,
} from "./hooks/usePlatformSession.js";
import { AdminLogin } from "./components/AdminLogin.jsx";
import { ADMIN_ROLE_LABEL } from "./utils/platform.constants.js";

const NAV = [
  [
    "Run the business",
    [
      ["/platform", "Overview", LuLayoutDashboard, true],
      ["/platform/salons", "Salons", LuStore],
      ["/platform/follow-ups", "Renewals & follow-ups", LuBellRing],
      ["/platform/messages", "Messages to salons", LuSend],
    ],
  ],
  [
    "Money & records",
    [
      ["/platform/plans", "Plans", LuTags],
      ["/platform/payments", "Payments", LuCreditCard],
      ["/platform/activity", "Activity log", LuHistory],
      ["/platform/webhooks", "Webhooks", LuWebhook],
      ["/platform/enquiries", "Website enquiries", LuInbox],
    ],
  ],
  [
    "Admin",
    [
      ["/platform/team", "Platform team", LuUsers, false, true],
      ["/platform/settings", "Settings", LuSettings],
    ],
  ],
];

function GlobalSearch() {
  const nav = useNavigate();
  const loc = useLocation();
  const [q, setQ] = useState(
    () => new URLSearchParams(loc.search).get("q") ?? "",
  );
  useEffect(() => {
    if (loc.pathname === "/platform/search")
      setQ(new URLSearchParams(loc.search).get("q") ?? "");
  }, [loc]);
  return (
    <form
      role="search"
      className="relative w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim().length >= 2)
          nav(`/platform/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <LuSearch
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        aria-hidden
      />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search everything"
        placeholder="Search salons, owners, staff, phone, email, customers, invoice no., payment id…"
        className="w-full rounded-full border border-stone-200 bg-stone-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
      />
    </form>
  );
}

function Sidebar({ isSuper, onNavigate }) {
  return (
    <nav
      aria-label="Platform admin"
      className="flex-1 space-y-5 overflow-y-auto px-3 py-4"
    >
      {NAV.map(([group, items]) => (
        <div key={group}>
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            {group}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {items
              .filter(([, , , , superOnly]) => !superOnly || isSuper)
              .map(([to, label, Icon, end]) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cx(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-rose-50 text-rose-800"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                      )
                    }
                  >
                    <Icon size={17} aria-hidden /> {label}
                  </NavLink>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function PlatformAdminPage() {
  const { status, admin, login, logout } = usePlatformSession();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  if (status === "checking")
    return (
      <div className="p-6">
        <Skeleton rows={4} />
      </div>
    );
  if (status === "out") return <AdminLogin onLogin={login} />;
  const isSuper = admin?.role === "SUPER_ADMIN";
  const who = (
    <div className="border-t border-stone-200 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-rose-100 text-sm font-bold text-rose-800">
          {admin?.name?.[0] ?? "?"}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-semibold">
            {admin?.name}
          </span>
          <span className="block text-xs text-stone-500">
            {ADMIN_ROLE_LABEL[admin?.role]}
          </span>
        </span>
        <button
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
          className="rounded-md p-2 text-stone-500 hover:bg-stone-100"
        >
          <LuLogOut />
        </button>
      </div>
    </div>
  );
  return (
    <PlatformContext.Provider value={{ admin, isSuper, logout }}>
      <div className="flex h-screen bg-stone-100">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white lg:flex">
          <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-3">
            <BrandLogo variant="mark" className="h-9" alt="" />
            <span className="leading-tight">
              <span className="block font-display text-base font-bold">
                Salora Glam
              </span>
              <span className="block text-[11px] text-stone-500">
                Platform admin
              </span>
            </span>
          </div>
          <Sidebar isSuper={isSuper} />
          {who}
        </aside>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              className="absolute inset-0 bg-black/40"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
                <BrandLogo className="h-9" />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="p-1"
                >
                  <LuX />
                </button>
              </div>
              <Sidebar isSuper={isSuper} onNavigate={() => setOpen(false)} />
              {who}
            </aside>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-4 md:px-6">
            <button
              className="rounded-md p-2 text-stone-600 hover:bg-stone-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <LuMenu />
            </button>
            <GlobalSearch />
            <span
              className={cx(
                "ml-auto hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline",
                isSuper
                  ? "bg-stone-900 text-white"
                  : "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
              )}
            >
              {ADMIN_ROLE_LABEL[admin?.role]}
            </span>
          </header>
          <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
            <ErrorBoundary key={pathname}>
              <Suspense fallback={<Skeleton rows={5} />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </PlatformContext.Provider>
  );
}
