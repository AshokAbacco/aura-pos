import { NavLink } from "react-router-dom";
import { cx } from "../../../utils/cx.js";
import { NAV_ITEMS } from "../navItems.js";

/**
 * Main menu. `rail` = desktop icon rail: only icons show until the pointer (or keyboard focus)
 * is on the sidebar, then labels fade in as it widens. The phone drawer always shows labels.
 */
export function SidebarNav({ can, rail = false }) {
  return (
    <nav
      aria-label="Main"
      className={cx(
        "flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden",
        rail ? "px-2.5 py-3" : "p-3",
      )}
    >
      {NAV_ITEMS.filter((n) => !n.perm || can(n.perm)).map(
        ({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={rail ? label : undefined}
            className={({ isActive }) =>
              cx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-rose-50 text-rose-800"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
              )
            }
          >
            <Icon size={18} className="shrink-0" aria-hidden />
            <span
              className={cx(
                "whitespace-nowrap",
                rail &&
                  "opacity-0 transition-opacity duration-150 group-hover/side:opacity-100 group-has-[:focus-visible]/side:opacity-100",
              )}
            >
              {label}
            </span>
          </NavLink>
        ),
      )}
    </nav>
  );
}
