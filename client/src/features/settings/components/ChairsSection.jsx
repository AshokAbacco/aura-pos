import { useState } from "react";
import {
  LuArmchair,
  LuSofa,
  LuHand,
  LuArrowUp,
  LuArrowDown,
  LuTrash2,
} from "react-icons/lu";
import { api, errorMessage } from "../../../lib/api.js";
import { Button } from "../../../components/ui";
import { Field } from "../../../components/forms";
import { useToast } from "../../../contexts/ToastContext.jsx";

const KIND_ICON = { CHAIR: LuArmchair, ROOM: LuSofa, STATION: LuHand };
const KINDS = [
  ["CHAIR", "Chair"],
  ["ROOM", "Room"],
  ["STATION", "Station"],
];

/**
 * Chairs, rooms and stations of one branch, grouped by floor. This is the floor plan shown on
 * the billing counter and the chairs offered when booking appointments.
 */
export function ChairsSection({ branch, onChanged }) {
  const toast = useToast();
  const floors = [...new Set(branch.resources.map((r) => r.floor))];
  const [f, setF] = useState({
    name: "",
    kind: "CHAIR",
    floor: floors[0] ?? "Ground floor",
  });
  const [busy, setBusy] = useState(false);

  const run = async (fn, msg) => {
    setBusy(true);
    try {
      await fn();
      if (msg) toast(msg);
      onChanged();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  const add = () =>
    run(
      () =>
        api.post(`/settings/branches/${branch.id}/resources`, {
          ...f,
          sortOrder: branch.resources.filter((r) => r.floor === f.floor).length,
        }),
      `${f.name} added`,
    ).then(() => setF({ ...f, name: "" }));
  const patch = (r, data, msg) =>
    run(() => api.patch(`/settings/resources/${r.id}`, data), msg);
  const swap = (list, i, j) =>
    run(async () => {
      // Renumber the floor so the order is stable, with the two chairs exchanged.
      const order = list.map((r) => r.id);
      [order[i], order[j]] = [order[j], order[i]];
      await Promise.all(
        order.map((id, n) =>
          api.patch(`/settings/resources/${id}`, { sortOrder: n }),
        ),
      );
    });

  return (
    <div className="space-y-5">
      {!branch.resources.length && (
        <p className="text-sm text-stone-500">
          No chairs yet. Add the first one below.
        </p>
      )}
      {floors.map((floor) => {
        const list = branch.resources.filter((r) => r.floor === floor);
        return (
          <div key={floor}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
              {floor}
            </p>
            <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
              {list.map((r, i) => {
                const Icon = KIND_ICON[r.kind] ?? LuArmchair;
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm"
                  >
                    <Icon className="text-stone-500" aria-hidden />
                    <input
                      aria-label={`Name of ${r.name}`}
                      defaultValue={r.name}
                      disabled={busy}
                      onBlur={(e) =>
                        e.target.value.trim() &&
                        e.target.value.trim() !== r.name &&
                        patch(r, { name: e.target.value.trim() }, "Renamed")
                      }
                      className="min-w-0 flex-1 rounded border border-transparent px-1.5 py-1 font-medium hover:border-stone-300 focus:border-stone-300"
                    />
                    <select
                      aria-label={`Floor of ${r.name}`}
                      value={r.floor}
                      disabled={busy}
                      onChange={(e) =>
                        patch(
                          r,
                          { floor: e.target.value, sortOrder: 99 },
                          `Moved to ${e.target.value}`,
                        )
                      }
                      className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs"
                    >
                      {floors.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={busy || i === 0}
                      onClick={() => swap(list, i, i - 1)}
                      aria-label={`Move ${r.name} up`}
                      className="rounded p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                    >
                      <LuArrowUp />
                    </button>
                    <button
                      type="button"
                      disabled={busy || i === list.length - 1}
                      onClick={() => swap(list, i, i + 1)}
                      aria-label={`Move ${r.name} down`}
                      className="rounded p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                    >
                      <LuArrowDown />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        patch(r, { isActive: false }, `${r.name} removed`)
                      }
                      aria-label={`Remove ${r.name}`}
                      className="rounded p-1.5 text-rose-700 hover:bg-rose-50"
                    >
                      <LuTrash2 />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <div className="grid items-end gap-2 rounded-lg bg-stone-50 p-3 sm:grid-cols-[1fr_8rem_11rem_auto]">
        <Field
          label="New chair or room"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          placeholder="Chair 5"
        />
        <Field
          as="select"
          label="Type"
          value={f.kind}
          onChange={(e) => setF({ ...f, kind: e.target.value })}
        >
          {KINDS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Field>
        <Field
          label="Floor"
          value={f.floor}
          onChange={(e) => setF({ ...f, floor: e.target.value })}
          list={`floors-${branch.id}`}
          placeholder="Ground floor"
        />
        <datalist id={`floors-${branch.id}`}>
          {[
            ...new Set([
              ...floors,
              "Ground floor",
              "First floor",
              "Second floor",
            ]),
          ].map((x) => (
            <option key={x} value={x} />
          ))}
        </datalist>
        <Button
          variant="primary"
          loading={busy}
          disabled={!f.name.trim() || !f.floor.trim()}
          onClick={add}
        >
          Add
        </Button>
      </div>
      <p className="text-xs text-stone-500">
        Removing a chair hides it from the counter and from new bookings; past
        bookings and bills keep it. A chair with an open bill can’t be removed.
      </p>
    </div>
  );
}
