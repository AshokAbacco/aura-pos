/**
 * Chair screen: add or remove what the client in this chair is having.
 * Catalogue on the left, the chair's ticket on the right. Changes save automatically;
 * billing is done from the floor plan ("View bill" / "Bill" on the chair card).
 */
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuArmchair } from "react-icons/lu";
import { api, errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { useToast } from "../../contexts/ToastContext.jsx";
import { Button, ErrorNote } from "../../components/ui";
import { ConfirmDialog } from "../../components/modals";
import { NewClientModal } from "../clients";
import { useChairTicket } from "./hooks/useChairTicket.js";
import { useClients } from "./hooks/useClients.js";
import { CatalogPanel } from "./components/CatalogPanel.jsx";
import { CustomChargeModal } from "./components/CustomChargeModal.jsx";
import { TicketPanel } from "./components/chair/TicketPanel.jsx";
import { BookingBanner } from "./components/chair/BookingBanner.jsx";
import { SaveStatus } from "./components/chair/SaveStatus.jsx";

export default function ChairPage() {
  const { chairId } = useParams();
  const navigate = useNavigate();
  const { can, writable } = useAuth();
  const toast = useToast();
  const ticket = useChairTicket(chairId, { toast });
  const { clients, reload: reloadClients } = useClients();
  const catalog = useApi("/catalog/items?activeOnly=true");
  const categories = useApi("/catalog/categories");
  const staff = useApi("/staff?bookable=true");
  const [modal, setModal] = useState(null); // 'client' | 'custom' | 'clear'
  const [sheet, setSheet] = useState(false);
  const [pulling, setPulling] = useState(false);
  const { cart, setCart, chair } = ticket;
  const customer = clients.find((c) => c.id === cart.customerId);
  const count = cart.lines.reduce((a, l) => a + l.quantity, 0);

  const addItem = (item) => {
    if (!writable) {
      toast("Read-only — renew your subscription to add items", "error");
      return;
    }
    setCart((c) => {
      const existing = c.lines.find(
        (l) => l.itemId === item.id && l.type === item.type,
      );
      if (existing)
        return {
          ...c,
          lines: c.lines.map((l) =>
            l === existing ? { ...l, quantity: l.quantity + 1 } : l,
          ),
        };
      return {
        ...c,
        lines: [
          ...c.lines,
          {
            key: crypto.randomUUID(),
            type: item.type,
            itemId: item.id,
            name: item.name,
            quantity: 1,
            unitPrice: item.price,
            listPrice: item.price,
            staffId: "",
            addedAt: new Date().toISOString(),
          },
        ],
      };
    });
    toast(`${item.name} added to ${chair?.name ?? "chair"}`);
  };

  // Members get their discount by default when they're seated.
  const setCustomer = (id) => {
    const c = clients.find((x) => x.id === id);
    setCart((t) => ({
      ...t,
      customerId: id,
      offer: c?.activeMembership
        ? "MEMBERSHIP"
        : t.offer === "MEMBERSHIP"
          ? "NONE"
          : t.offer,
    }));
  };

  const pullBooking = async () => {
    const a = chair.nextAppointment;
    setPulling(true);
    try {
      const r = await api.get(`/appointments/${a.id}/cart`);
      const c = r.data.data;
      const member = clients.find(
        (x) => x.id === c.customerId,
      )?.activeMembership;
      setCart((t) => ({
        ...t,
        appointmentId: c.appointmentId,
        customerId: c.customerId ?? t.customerId,
        offer: member ? "MEMBERSHIP" : t.offer,
        lines: [
          ...t.lines,
          ...c.lines.map((l) => ({
            ...l,
            key: crypto.randomUUID(),
            name: l.description,
            listPrice: l.unitPrice,
            staffId: l.staffId ?? "",
            addedAt: new Date().toISOString(),
          })),
        ],
      }));
      toast("Booking added to this chair");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setPulling(false);
    }
  };

  const done = async () => {
    await ticket.flush();
    navigate("/app/pos");
  };
  const clear = async (reason) => {
    try {
      await ticket.flush();
      await api.delete(`/pos/chairs/${chairId}/ticket`, { data: { reason } });
      toast(`${chair?.name} is free`);
      navigate("/app/pos");
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  if (ticket.error)
    return (
      <div className="p-6">
        <ErrorNote onRetry={ticket.reload}>{ticket.error}</ErrorNote>
        <Link
          to="/app/pos"
          className="mt-4 inline-block text-sm font-semibold text-rose-700"
        >
          Back to the floor
        </Link>
      </div>
    );

  const booking =
    chair?.nextAppointment &&
    !cart.appointmentId &&
    (!cart.customerId || cart.customerId === chair.nextAppointment.customerId)
      ? chair.nextAppointment
      : null;
  const panel = (
    <TicketPanel
      ticket={ticket}
      clients={clients}
      customer={customer}
      staff={staff.data ?? []}
      can={can}
      writable={writable}
      onCustomer={setCustomer}
      onNewClient={() => setModal("client")}
      onCustomCharge={() => setModal("custom")}
      onDone={done}
      onClear={() => setModal("clear")}
    />
  );

  return (
    <div className="flex h-full flex-col bg-stone-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={done}
            className="grid h-10 w-10 place-items-center rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
            aria-label="Back to floor plan"
          >
            <LuArrowLeft />
          </button>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700">
            <LuArmchair size={20} />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight text-stone-900">
              {chair?.name ?? "Chair"}
            </h1>
            <p className="text-xs text-stone-500">
              {chair?.floor}
              {customer ? ` · ${customer.name}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SaveStatus status={ticket.status} />
        </div>
      </header>

      {booking && (
        <div className="px-4 pt-3">
          <BookingBanner
            appointment={booking}
            onAdd={pullBooking}
            busy={pulling || !writable}
          />
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-4 lg:p-4 lg:pt-3">
        <div className="flex min-w-0 flex-1 rounded-2xl lg:border lg:border-stone-200 lg:bg-white">
          <CatalogPanel
            catalog={catalog}
            categories={categories.data}
            onAdd={addItem}
          />
        </div>
        <aside
          className="hidden w-[390px] shrink-0 lg:flex lg:flex-col"
          aria-label={`Items on ${chair?.name ?? "chair"}`}
        >
          {panel}
        </aside>
      </div>

      {/* Phones and tablets: the chair's items open as a bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white p-3 lg:hidden">
        <Button
          variant="primary"
          className="w-full"
          onClick={() => setSheet(true)}
        >
          {chair?.name ?? "Chair"} · {count} item{count === 1 ? "" : "s"}
        </Button>
      </div>
      {sheet && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Items on this chair"
        >
          <div
            className="absolute inset-0 bg-stone-900/40"
            onClick={() => setSheet(false)}
          />
          <div className="absolute inset-x-0 bottom-0 top-12 flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl">
            <button
              onClick={() => setSheet(false)}
              className="absolute right-3 top-2 z-10 rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold"
            >
              Close
            </button>
            {panel}
          </div>
        </div>
      )}

      {modal === "client" && (
        <NewClientModal
          onClose={() => setModal(null)}
          onCreated={(c) => {
            reloadClients().then(() => setCustomer(c.id));
            setModal(null);
          }}
        />
      )}
      {modal === "custom" && (
        <CustomChargeModal
          staff={staff.data ?? []}
          onClose={() => setModal(null)}
          onAdd={(line) => {
            setCart((t) => ({
              ...t,
              lines: [
                ...t.lines,
                { ...line, addedAt: new Date().toISOString() },
              ],
            }));
            setModal(null);
          }}
        />
      )}
      {modal === "clear" && (
        <ConfirmDialog
          danger
          title={`Clear ${chair?.name ?? "this chair"}?`}
          description="All items are removed and the chair becomes free. Nothing is billed. This is recorded in the audit log."
          confirmLabel="Clear chair"
          reasonLabel="Reason"
          reasonPlaceholder="Client left without service"
          onConfirm={clear}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
