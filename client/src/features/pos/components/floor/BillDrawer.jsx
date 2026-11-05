/**
 * Bill panel for one chair, opened from the floor plan ("View bill" / "Bill").
 * Shows what's on the chair's ticket with server-calculated totals, lets the cashier set the offer,
 * tip and payment, and bills it. Checkout closes the chair's ticket in the same transaction.
 */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LuX, LuPencil, LuUserRound } from "react-icons/lu";
import { money } from "../../../../utils/format.js";
import { Button, Skeleton } from "../../../../components/ui";
import { Field } from "../../../../components/forms";
import { usePosCart } from "../../hooks/usePosCart.js";
import { useChairTicket } from "../../hooks/useChairTicket.js";
import { CartTotals } from "../CartTotals.jsx";
import { PaymentPicker } from "../PaymentPicker.jsx";

export function BillDrawer({
  chairId,
  focusPay,
  clients,
  staff,
  can,
  writable,
  toast,
  onClose,
  onSettled,
}) {
  const ticket = useChairTicket(chairId, { toast });
  const pos = usePosCart({
    toast,
    cart: ticket.cart,
    setCart: ticket.setCart,
    beforeCheckout: ticket.closeArgs,
    onSettled,
  });
  const { cart, quote, quoteErr, setField } = pos;
  const customer = clients.find((c) => c.id === cart.customerId);
  const staffName = (id) => staff.find((s) => s.id === id)?.name;
  const payRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);
  useEffect(() => {
    if (focusPay && quote)
      payRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusPay, quote]);
  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  const loading = ticket.status === "loading";
  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-drawer-title"
    >
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <section
        ref={panelRef}
        tabIndex={-1}
        className="receipt-counter absolute inset-y-0 right-0 flex w-full max-w-md flex-col shadow-2xl outline-none"
      >
        <header className="flex items-start justify-between gap-3 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              {ticket.chair?.floor}
            </p>
            <h2
              id="bill-drawer-title"
              className="text-lg font-bold text-stone-900"
            >
              {ticket.chair?.name ?? "Chair"} · Bill
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-600">
              <LuUserRound size={14} />
              {customer
                ? `${customer.name} · ${customer.phone}`
                : "Walk-in client"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close bill"
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
          >
            <LuX size={20} />
          </button>
        </header>

        <div className="perforated mx-3 flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
              <Skeleton rows={4} />
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Items
                  </p>
                  <Link
                    to={`/app/pos/chairs/${chairId}`}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"
                  >
                    <LuPencil size={12} /> Edit items
                  </Link>
                </div>
                {!cart.lines.length && (
                  <p className="py-8 text-center text-sm text-stone-500">
                    No items on this chair yet.
                  </p>
                )}
                <ul className="divide-y divide-dashed divide-stone-200">
                  {cart.lines.map((l, i) => {
                    const q = quote?.lines?.[i];
                    return (
                      <li
                        key={l.key}
                        className="flex items-start justify-between gap-3 py-2.5 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium text-stone-900">
                            {l.name}
                            {l.quantity > 1 && (
                              <span className="text-stone-500">
                                {" "}
                                × {l.quantity}
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-stone-500">
                            {staffName(l.staffId)
                              ? `by ${staffName(l.staffId)}`
                              : l.type === "PRODUCT"
                                ? "Retail"
                                : "No stylist"}
                            {q && Number(q.discountAmount) > 0
                              ? ` · −${money(q.discountAmount)} off`
                              : ""}
                          </span>
                        </span>
                        <span className="num shrink-0 font-semibold">
                          {money(
                            q?.grossAmount ?? Number(l.unitPrice) * l.quantity,
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          <div className="space-y-3 border-t border-dashed border-stone-300 bg-white/70 px-4 py-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <Field
                as="select"
                label="Offer"
                value={cart.offer}
                onChange={(e) => setField({ offer: e.target.value })}
              >
                <option value="NONE">No discount</option>
                {customer?.activeMembership && (
                  <option value="MEMBERSHIP">Member discount</option>
                )}
                {can("pos.discount") && (
                  <option value="COUPON">Coupon code</option>
                )}
              </Field>
              {cart.offer === "COUPON" ? (
                <Field
                  label="Code"
                  value={cart.couponCode}
                  onChange={(e) =>
                    setField({ couponCode: e.target.value.toUpperCase() })
                  }
                  placeholder="FIRST10"
                />
              ) : (
                <Field
                  label="Tip (₹)"
                  type="number"
                  min="0"
                  step="10"
                  value={cart.tip}
                  onChange={(e) => setField({ tip: e.target.value })}
                />
              )}
            </div>
            {quoteErr && (
              <p
                className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-800"
                role="alert"
              >
                {quoteErr}
              </p>
            )}
            <CartTotals quote={quote} />
            <div ref={payRef}>
              <PaymentPicker
                payments={pos.payments}
                setPayments={pos.setPayments}
                split={pos.split}
                onToggleSplit={pos.toggleSplit}
                due={pos.due}
                hasCustomer={!!customer}
              />
            </div>
            <Button
              variant="primary"
              className="w-full py-3 text-base"
              onClick={pos.checkout}
              loading={pos.busy}
              disabled={
                !quote ||
                !writable ||
                !can("pos.bill") ||
                Math.abs(pos.due) > 0.004
              }
            >
              {writable
                ? `Bill ${quote ? money(quote.grandTotal) : ""} & free ${ticket.chair?.name ?? "chair"}`
                : "Read-only — renew to bill"}
            </Button>
          </div>
        </div>
        <div className="h-3" />
      </section>
    </div>
  );
}
