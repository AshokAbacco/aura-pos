import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiMenu, FiClock, FiChevronLeft } from "react-icons/fi";
import { BrandLogo } from "../../../components/ui/BrandLogo.jsx";
import { NAV_ITEMS } from "../navItems.js";
import { InboxBell } from "./InboxBell.jsx";

const TOP_LEVEL = new Set(NAV_ITEMS.map((n) => n.to));

/**
 * Back arrow on screens below a menu page (a chair, an invoice, quick sale…).
 * iPhones have no hardware back button, so the app always needs one on screen.
 */
function BackButton() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  if (TOP_LEVEL.has(pathname.replace(/\/$/, ""))) return null;
  const parent = pathname.split("/").slice(0, 3).join("/"); // /app/pos/chairs/1 → /app/pos
  const back = () =>
    window.history.state?.idx > 0
      ? nav(-1)
      : nav(TOP_LEVEL.has(parent) ? parent : "/app");
  return (
    <button
      onClick={back}
      className="-ml-1 flex items-center rounded-md p-1.5 text-stone-700 hover:bg-stone-100"
      aria-label="Back"
    >
      <FiChevronLeft size={22} />
    </button>
  );
}

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="num inline-flex items-center gap-1">
      <FiClock aria-hidden />
      {now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
    </span>
  );
}

/** Salon name, clock, GSTIN, branch switcher, user and sign-out. */
export function TopBar({ me, onMenu, onLogout }) {
  const branch = sessionStorage.getItem("aura.branch");
  const changeBranch = (id) => {
    sessionStorage.setItem("aura.branch", id);
    window.location.reload();
  };
  return (
    <header className="safe-top no-print shrink-0 border-b border-stone-200 bg-white">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <BackButton />
          <button
            className="rounded-md p-1.5 text-stone-600 hover:bg-stone-100 lg:hidden"
            onClick={onMenu}
            aria-label="Open menu"
          >
            <FiMenu />
          </button>
          <BrandLogo variant="mark" className="hidden h-9 sm:block" alt="" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-stone-900">
              {me?.tenant.displayName}
            </p>
            <p className="flex gap-3 text-xs text-stone-500">
              <Clock />
              {me?.tenant.gstin && (
                <span className="hidden sm:inline">
                  GSTIN {me.tenant.gstin}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {me?.branches.length > 1 ? (
            <select
              aria-label="Branch"
              value={branch ?? ""}
              onChange={(e) => changeBranch(e.target.value)}
              className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm"
            >
              {me.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="hidden rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 sm:inline">
              {me?.branches[0]?.name}
            </span>
          )}
          <span className="hidden text-sm text-stone-600 md:inline">
            {me?.user.name}
          </span>
          <InboxBell />
          <button
            onClick={onLogout}
            className="rounded-md p-2 text-stone-500 hover:bg-stone-100"
            aria-label="Sign out"
            title="Sign out"
          >
            <FiLogOut />
          </button>
        </div>
      </div>
    </header>
  );
}
