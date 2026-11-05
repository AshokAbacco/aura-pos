/** Queue & chairs: the day's bookings grouped by stylist, with booking, status steps and "Bill". */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { todayISO } from "../../utils/format.js";
import {
  Button,
  PageHeader,
  ErrorNote,
  Skeleton,
  Empty,
} from "../../components/ui";
import { Field } from "../../components/forms";
import { useApi } from "../../hooks/useApi.js";
import { useToast } from "../../contexts/ToastContext.jsx";
import { dayRange } from "./utils/appointments.constants.js";
import { ConfirmDialog } from "../../components/modals";
import { BookingModal } from "./components/BookingModal.jsx";
import { StaffQueueColumn } from "./components/StaffQueueColumn.jsx";

export default function AppointmentsPage() {
  const { can, writable } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [day, setDay] = useState(todayISO());
  const r = dayRange(day);
  const appts = useApi(
    `/appointments?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`,
  );
  const staff = useApi("/staff?bookable=true");
  const services = useApi("/catalog/items?type=SERVICE&activeOnly=true");
  const clients = useApi("/clients?pageSize=100");
  const [booking, setBooking] = useState(false);
  const canManage = can("appointments.manage") && writable;

  const byStaff = useMemo(() => {
    const m = new Map(
      (staff.data ?? []).map((s) => [s.id, { staff: s, items: [] }]),
    );
    for (const a of appts.data ?? []) {
      if (!m.has(a.staffId)) m.set(a.staffId, { staff: a.staff, items: [] });
      m.get(a.staffId).items.push(a);
    }
    return [...m.values()];
  }, [appts.data, staff.data]);

  const [cancelling, setCancelling] = useState(null);
  const setStatus = async (a, status, reason) => {
    try {
      await api.post(`/appointments/${a.id}/status`, {
        status,
        reason: reason || undefined,
      });
      appts.reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
  const move = (a, status) =>
    status === "CANCELLED" ? setCancelling(a) : setStatus(a, status);

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Queue & chairs"
        subtitle="Bookings and walk-ins by stylist. Send a finished service straight to billing."
        actions={
          <>
            <Field
              type="date"
              aria-label="Day"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
            {canManage && (
              <Button variant="primary" onClick={() => setBooking(true)}>
                Book or add walk-in
              </Button>
            )}
          </>
        }
      />
      {appts.error && (
        <ErrorNote onRetry={appts.reload}>{appts.error}</ErrorNote>
      )}
      {appts.loading || staff.loading ? (
        <Skeleton rows={5} />
      ) : !byStaff.length ? (
        <Empty title="No bookable staff yet">
          Add staff on the Staff page and mark them bookable.
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {byStaff.map(({ staff: s, items }) => (
            <StaffQueueColumn
              key={s.id}
              staff={s}
              items={items}
              canManage={canManage}
              canBill={can("pos.bill")}
              onMove={move}
              onBill={(a) => navigate(`/app/pos/quick?appointment=${a.id}`)}
            />
          ))}
        </div>
      )}
      {cancelling && (
        <ConfirmDialog
          title={`Cancel ${cancelling.customer.name}’s appointment?`}
          description={`${cancelling.serviceName} with ${cancelling.staff.name}. The time becomes free for other bookings.`}
          confirmLabel="Cancel appointment"
          cancelLabel="Keep it"
          danger
          reasonLabel="Reason"
          reasonPlaceholder="Client called to cancel"
          minReason={0}
          onClose={() => setCancelling(null)}
          onConfirm={async (reason) => {
            await setStatus(cancelling, "CANCELLED", reason);
            setCancelling(null);
          }}
        />
      )}
      {booking && (
        <BookingModal
          staff={staff.data ?? []}
          services={services.data ?? []}
          clients={clients.data ?? []}
          defaultDate={day}
          onClose={() => setBooking(false)}
          onSaved={() => {
            setBooking(false);
            appts.reload();
          }}
        />
      )}
    </div>
  );
}
