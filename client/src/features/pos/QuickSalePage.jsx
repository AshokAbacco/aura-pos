/**
 * Quick sale: bill without a chair (retail over the counter, memberships, appointments sent from
 * the queue, a client sent from the Clients page). Catalogue on the left, the bill on the right
 * (bottom sheet on phones). State lives in hooks/usePosCart.js.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import { api, errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { money } from "../../utils/format.js";
import { Button } from "../../components/ui";
import { useApi } from "../../hooks/useApi.js";
import { useToast } from "../../contexts/ToastContext.jsx";
import { ReceiptModal } from "../../components/receipt/Receipt.jsx";
import { NewClientModal } from "../clients";
import { usePosCart } from "./hooks/usePosCart.js";
import { emptyCart } from "./utils/posDraft.js";
import { CatalogPanel } from "./components/CatalogPanel.jsx";
import { CartPanel } from "./components/CartPanel.jsx";
import { CustomChargeModal } from "./components/CustomChargeModal.jsx";
import { ParkedBillsModal } from "./components/ParkedBillsModal.jsx";

export default function QuickSalePage() {
  const { can, writable } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const catalog = useApi("/catalog/items?activeOnly=true");
  const staff = useApi("/staff?bookable=true");
  const categories = useApi("/catalog/categories");
  const plans = useApi("/memberships/plans");
  const [clients, setClients] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [modal, setModal] = useState(null); // 'client' | 'custom' | 'parked'
  const [sheet, setSheet] = useState(false);

  const loadClients = useCallback(
    () =>
      api
        .get("/clients?pageSize=100")
        .then((r) => setClients(r.data.data))
        .catch(() => {}),
    [],
  );
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const pos = usePosCart({
    toast,
    onSettled: (invoice) => {
      setReceipt(invoice);
      setSheet(false);
      catalog.reload();
      loadClients();
    },
  });
  const { cart, setField, reset } = pos;
  const customer = clients.find((c) => c.id === cart.customerId);

  // Members get their discount by default (like the prototype); switching to a non-member removes it.
  useEffect(() => {
    setField({
      offer: customer?.activeMembership
        ? "MEMBERSHIP"
        : cart.offer === "MEMBERSHIP"
          ? "NONE"
          : cart.offer,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id, customer?.activeMembership]);

  // Handoffs from other pages: ?appointment=<id> and ?membership=<planId>
  useEffect(() => {
    const appt = params.get("appointment");
    const plan = params.get("membership");
    if (appt) {
      api
        .get(`/appointments/${appt}/cart`)
        .then((r) => {
          const c = r.data.data;
          reset({
            ...emptyCart(),
            appointmentId: c.appointmentId,
            customerId: c.customerId,
            lines: c.lines.map((l) => ({
              ...l,
              key: crypto.randomUUID(),
              name: l.description,
              listPrice: l.unitPrice,
            })),
          });
          toast("Appointment loaded into the bill");
        })
        .catch((e) => toast(errorMessage(e), "error"));
      setParams({}, { replace: true });
    } else if (plan && plans.data) {
      const p = plans.data.find((x) => x.id === plan);
      if (p)
        pos.addLine({
          key: crypto.randomUUID(),
          type: "MEMBERSHIP",
          itemId: p.id,
          name: `Membership: ${p.name}`,
          quantity: 1,
          unitPrice: p.price,
          listPrice: p.price,
        });
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, plans.data]);

  const park = () =>
    pos.park(
      customer?.name ??
        `Cart ${new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`,
    );

  const cartPanel = (
    <CartPanel
      pos={pos}
      clients={clients}
      customer={customer}
      staff={staff.data ?? []}
      can={can}
      writable={writable}
      onNewClient={() => setModal("client")}
      onCustomCharge={() => setModal("custom")}
      onPark={park}
    />
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-2.5">
        <Link
          to="/app/pos"
          className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <LuArrowLeft size={15} /> Floor plan
        </Link>
        <h1 className="text-base font-bold text-stone-900">Quick sale</h1>
        <span className="hidden text-sm text-stone-500 sm:inline">
          Bill without a chair — retail, memberships and walk-ins
        </span>
      </div>
      <div className="flex min-h-0 flex-1">
        <CatalogPanel
          catalog={catalog}
          categories={categories.data}
          onAdd={pos.addItem}
          onOpenParked={() => setModal("parked")}
        />

        <aside
          className="receipt-counter hidden w-[400px] shrink-0 px-3 lg:flex lg:flex-col"
          aria-label="Current bill"
        >
          {cartPanel}
        </aside>

        {/* Phones and tablets: sticky total bar that opens the bill as a bottom sheet */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white p-3 lg:hidden">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setSheet(true)}
          >
            Bill · {cart.lines.reduce((a, l) => a + l.quantity, 0)} items ·{" "}
            {money(pos.quote?.grandTotal)}
          </Button>
        </div>
        {sheet && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Current bill"
          >
            <div
              className="absolute inset-0 bg-stone-900/40"
              onClick={() => setSheet(false)}
            />
            <div className="receipt-counter absolute inset-x-0 bottom-0 top-12 flex flex-col overflow-hidden rounded-t-2xl px-2 shadow-2xl">
              <button
                onClick={() => setSheet(false)}
                className="absolute right-3 top-2 z-10 rounded-md bg-white/80 px-2 py-1 text-xs font-semibold"
              >
                Close
              </button>
              {cartPanel}
            </div>
          </div>
        )}
      </div>
      <ReceiptModal invoice={receipt} onClose={() => setReceipt(null)} />
      {modal === "client" && (
        <NewClientModal
          onClose={() => setModal(null)}
          onCreated={(c) => {
            loadClients().then(() => setField({ customerId: c.id }));
            setModal(null);
          }}
        />
      )}
      {modal === "custom" && (
        <CustomChargeModal
          staff={staff.data ?? []}
          onClose={() => setModal(null)}
          onAdd={(line) => {
            pos.addLine(line);
            setModal(null);
          }}
        />
      )}
      {modal === "parked" && (
        <ParkedBillsModal
          onClose={() => setModal(null)}
          onResume={(p) => {
            reset({ ...emptyCart(), ...p.payload });
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
