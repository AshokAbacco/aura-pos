/**
 * Billing counter — floor plan.
 * Every chair/room of the branch, grouped by floor. Tap a chair to add or remove what the client
 * is having; "View bill" opens the bill panel for that chair; "Bill" takes payment and frees it.
 * Retail-only sales (no chair) use "Quick sale".
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuShoppingBag,
  LuSearch,
  LuRefreshCw,
  LuSettings2,
} from "react-icons/lu";
import { api, errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { useToast } from "../../contexts/ToastContext.jsx";
import { ErrorNote, Skeleton } from "../../components/ui";
import { ConfirmDialog } from "../../components/modals";
import { ReceiptModal } from "../../components/receipt/Receipt.jsx";
import { useFloor } from "./hooks/useFloor.js";
import { useClients } from "./hooks/useClients.js";
import { useNow } from "./hooks/useNow.js";
import { groupByFloor } from "./utils/floor.js";
import { FloorSummary } from "./components/floor/FloorSummary.jsx";
import { FloorTabs } from "./components/floor/FloorTabs.jsx";
import { ChairCard } from "./components/floor/ChairCard.jsx";
import { BillDrawer } from "./components/floor/BillDrawer.jsx";
import { MoveChairModal } from "./components/floor/MoveChairModal.jsx";

export default function FloorPage() {
  const { can, writable } = useAuth();
  const toast = useToast();
  const floor = useFloor();
  const { clients, reload: reloadClients } = useClients();
  const staff = useApi("/staff?bookable=true");
  const now = useNow();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState(null); // { chairId, pay }
  const [moving, setMoving] = useState(null);
  const [clearing, setClearing] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const chairs = floor.chairs ?? [];
  const floors = useMemo(() => groupByFloor(chairs), [chairs]);
  const match = (c) =>
    !q ||
    `${c.name} ${c.ticket?.customer?.name ?? ""} ${c.nextAppointment?.customer?.name ?? ""}`
      .toLowerCase()
      .includes(q.toLowerCase());
  const shown = floors
    .filter(([f]) => tab === "all" || tab === f)
    .map(([f, cs]) => [f, cs.filter(match)])
    .filter(([, cs]) => cs.length);

  const clear = async (reason) => {
    try {
      await api.delete(`/pos/chairs/${clearing.id}/ticket`, {
        data: { reason },
      });
      toast(`${clearing.name} is free`);
      setClearing(null);
      floor.reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  return (
    <div className="min-h-full bg-stone-50 p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Billing counter</h1>
          <p className="text-sm text-stone-600">
            Tap a chair to add services or products. Bill it when the client is
            done.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={floor.reload}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
            title="Refresh"
          >
            <LuRefreshCw
              size={15}
              className={floor.loading ? "animate-spin" : ""}
            />{" "}
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {can("settings.manage") && (
            <Link
              to="/app/settings#chairs"
              className="flex h-10 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <LuSettings2 size={15} />{" "}
              <span className="hidden sm:inline">Chairs & floors</span>
            </Link>
          )}
          <Link
            to="/app/pos/quick"
            className="flex h-10 items-center gap-1.5 rounded-lg bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-800"
          >
            <LuShoppingBag size={16} /> Quick sale
          </Link>
        </div>
      </div>

      {floor.error && (
        <ErrorNote onRetry={floor.reload}>{floor.error}</ErrorNote>
      )}
      {floor.loading && !floor.chairs ? (
        <Skeleton rows={6} />
      ) : (
        <>
          <FloorSummary chairs={chairs} />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <FloorTabs floors={floors} value={tab} onChange={setTab} />
            <label className="relative w-full sm:w-64">
              <LuSearch
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                aria-hidden
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Find chair or client"
                aria-label="Find chair or client"
                className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm"
              />
            </label>
          </div>

          {!chairs.length && (
            <div className="mt-8 rounded-2xl border-2 border-dashed border-stone-300 bg-white p-10 text-center">
              <p className="font-semibold text-stone-800">
                No chairs set up for this branch yet
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Add your chairs and rooms by floor in Salon settings, or use
                Quick sale meanwhile.
              </p>
            </div>
          )}

          {shown.map(([f, cs]) => (
            <section key={f} className="mt-6" aria-label={f}>
              <h2 className="mb-3 flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-stone-500">
                {f}
                <span className="h-px flex-1 bg-stone-200" />
                <span className="text-xs font-semibold normal-case tracking-normal">
                  {cs.filter((c) => c.ticket).length} busy ·{" "}
                  {cs.filter((c) => !c.ticket).length} free
                </span>
              </h2>
              <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {cs.map((c) => (
                  <ChairCard
                    key={c.id}
                    chair={c}
                    now={now}
                    canBill={writable}
                    onView={(ch, opts) =>
                      setDrawer({ chairId: ch.id, pay: !!opts?.pay })
                    }
                    onMove={setMoving}
                    onClear={setClearing}
                  />
                ))}
              </div>
            </section>
          ))}
          {chairs.length > 0 && !shown.length && (
            <p className="mt-10 text-center text-sm text-stone-500">
              No chair or client matches “{q}”.
            </p>
          )}
        </>
      )}

      {drawer && (
        <BillDrawer
          chairId={drawer.chairId}
          focusPay={drawer.pay}
          clients={clients}
          staff={staff.data ?? []}
          can={can}
          writable={writable}
          toast={toast}
          onClose={() => {
            setDrawer(null);
            floor.reload();
          }}
          onSettled={(invoice) => {
            setDrawer(null);
            setReceipt(invoice);
            floor.reload();
            reloadClients();
          }}
        />
      )}
      {moving && (
        <MoveChairModal
          chair={moving}
          chairs={chairs}
          toast={toast}
          onClose={() => setMoving(null)}
          onMoved={() => {
            setMoving(null);
            floor.reload();
          }}
        />
      )}
      {clearing && (
        <ConfirmDialog
          danger
          title={`Clear ${clearing.name} without billing?`}
          description="The items on this chair are removed and the chair becomes free. This is recorded in the audit log."
          confirmLabel="Clear chair"
          reasonLabel="Reason"
          reasonPlaceholder="Client left without service"
          onConfirm={clear}
          onClose={() => setClearing(null)}
        />
      )}
      <ReceiptModal invoice={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
