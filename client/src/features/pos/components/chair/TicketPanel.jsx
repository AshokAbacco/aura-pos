import { LuPencil, LuStickyNote, LuTrash2, LuArrowLeft } from "react-icons/lu";
import { ClientPicker } from "../ClientPicker.jsx";
import { CartLine } from "../CartLine.jsx";
import { SaveStatus } from "./SaveStatus.jsx";

/**
 * Right side of the chair screen: who is in the chair and what they are having.
 * No totals or payment here — billing happens from the floor plan.
 */
export function TicketPanel({
  ticket,
  clients,
  customer,
  staff,
  can,
  writable,
  onCustomer,
  onNewClient,
  onCustomCharge,
  onDone,
  onClear,
}) {
  const { cart, setCart, status } = ticket;
  const updateLine = (key, patch) =>
    setCart((c) => ({
      ...c,
      lines: c.lines
        .map((l) => (l.key === key ? { ...l, ...patch } : l))
        .filter((l) => l.quantity > 0),
    }));
  const count = cart.lines.reduce((a, l) => a + l.quantity, 0);
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-t-2xl bg-white lg:rounded-2xl lg:border lg:border-stone-200">
      <ClientPicker
        clients={clients}
        customerId={cart.customerId}
        customer={customer}
        onChange={onCustomer}
        onNewClient={can("customers.manage") && writable ? onNewClient : null}
      />

      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          On this chair · {count} item{count === 1 ? "" : "s"}
        </p>
        <SaveStatus status={status} />
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {!cart.lines.length && (
          <div className="rounded-xl border-2 border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-500">
            Tap services or products on the left to add them to this chair.
          </div>
        )}
        {cart.lines.map((l) => (
          <CartLine
            key={l.key}
            line={l}
            staff={staff}
            canEditPrice={can("pos.price_override") && writable}
            onChange={(patch) => updateLine(l.key, patch)}
          />
        ))}
        {can("pos.custom_item") && writable && (
          <button
            onClick={onCustomCharge}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"
          >
            <LuPencil size={12} /> Add custom charge
          </button>
        )}
        <label className="block pt-2">
          <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-stone-600">
            <LuStickyNote size={12} /> Note for the counter
          </span>
          <textarea
            value={cart.note ?? ""}
            maxLength={300}
            disabled={!writable}
            onChange={(e) => setCart((c) => ({ ...c, note: e.target.value }))}
            placeholder="e.g. Client wants the bill on wallet"
            className="min-h-16 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-2 border-t border-stone-100 p-3">
        <button
          type="button"
          onClick={onClear}
          disabled={!writable || (!cart.lines.length && !cart.customerId)}
          className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
        >
          <LuTrash2 size={15} /> Clear
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex items-center justify-center gap-2 rounded-lg bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
        >
          <LuArrowLeft size={15} /> Done — back to floor
        </button>
      </div>
    </div>
  );
}
