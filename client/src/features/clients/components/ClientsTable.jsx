import { Link } from "react-router-dom";
import { money } from "../../../utils/format.js";
import { Badge, Button } from "../../../components/ui";
import { draftForClient } from "../../pos";

/** Table on wide screens, stacked rows on phones. */
export function ClientsTable({
  clients,
  canBill,
  onWallet,
  page,
  total,
  pageSize,
  onPage,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="hidden bg-stone-50 text-left text-xs text-stone-500 md:table-header-group">
          <tr>
            <th className="px-4 py-2">Client</th>
            <th className="px-4">Membership</th>
            <th className="px-4">Notes</th>
            <th className="px-4 text-right">Visits</th>
            <th className="px-4 text-right">Wallet</th>
            <th className="px-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {clients.map((c) => (
            <tr
              key={c.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 md:table-row md:p-0"
            >
              <td className="md:px-4 md:py-3">
                <span className="block font-semibold">{c.name}</span>
                <span className="text-xs text-stone-500">{c.phone}</span>
              </td>
              <td className="md:px-4">
                {c.activeMembership ? (
                  <Badge tone="rose">{c.activeMembership.planName}</Badge>
                ) : (
                  <span className="text-xs text-stone-400">None</span>
                )}
              </td>
              <td
                className="w-full max-w-xs truncate text-xs text-stone-600 md:w-auto md:px-4"
                title={c.colorFormula ?? c.notes ?? ""}
              >
                {c.colorFormula ?? c.notes ?? "—"}
              </td>
              <td className="num text-xs md:px-4 md:text-right md:text-sm">
                {c.visitCount} visits
              </td>
              <td className="num text-xs font-semibold md:px-4 md:text-right md:text-sm">
                {money(c.walletBalance)}
              </td>
              <td className="ml-auto flex gap-1 md:table-cell md:px-4 md:text-right">
                <Button size="sm" variant="ghost" onClick={() => onWallet(c)}>
                  Wallet
                </Button>
                {canBill && (
                  <Link
                    to="/app/pos/quick"
                    onClick={() => draftForClient(c.id)}
                    className="inline-flex h-8 items-center rounded-lg bg-stone-900 px-3 text-xs font-semibold text-white"
                  >
                    Bill
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {total > pageSize && (
        <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2 text-sm">
          <span className="text-stone-500">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={page === 1}
              onClick={() => onPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              disabled={page * pageSize >= total}
              onClick={() => onPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
