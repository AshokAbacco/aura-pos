import { useEffect, useMemo, useState } from "react";
import {
  LuArmchair,
  LuSofa,
  LuHand,
  LuChevronLeft,
  LuChevronRight,
  LuTrash2,
  LuPencil,
  LuPlus,
  LuMinus,
  LuCheck,
  LuX,
  LuLayers,
} from "react-icons/lu";
import { api, errorMessage } from "../../../lib/api.js";
import { Button } from "../../../components/ui";
import { ConfirmDialog } from "../../../components/modals";
import { useToast } from "../../../contexts/ToastContext.jsx";
import { cx } from "../../../utils/cx.js";

const KINDS = {
  CHAIR: { label: "Chair", plural: "chairs", icon: LuArmchair },
  ROOM: { label: "Room", plural: "rooms", icon: LuSofa },
  STATION: { label: "Station", plural: "stations", icon: LuHand },
};
const FLOOR_SUGGESTIONS = [
  "Ground floor",
  "First floor",
  "Second floor",
  "Third floor",
  "Basement",
  "Terrace",
];
const byOrder = (a, b) =>
  a.sortOrder - b.sortOrder ||
  a.name.localeCompare(b.name, undefined, { numeric: true });

/**
 * Chairs, rooms and stations of one branch, grouped by floor: the floor plan on the billing
 * counter and the chairs offered when booking. Every change is saved straight away and updates
 * this list in place (no page reload, no jump to the top).
 */
export function ChairsSection({ branch }) {
  const toast = useToast();
  const [items, setItems] = useState(branch.resources);
  const [emptyFloors, setEmptyFloors] = useState([]); // floors added here that have no chair yet
  const [removing, setRemoving] = useState(null);
  const [addingFloor, setAddingFloor] = useState(false);
  useEffect(() => {
    setItems(branch.resources);
  }, [branch.resources]);

  const floors = useMemo(() => {
    const names = [...new Set(items.map((r) => r.floor))];
    return [...names, ...emptyFloors.filter((f) => !names.includes(f))];
  }, [items, emptyFloors]);
  const onFloor = (floor) =>
    items.filter((r) => r.floor === floor).sort(byOrder);

  const fail = (e) => toast(errorMessage(e), "error");
  const replace = (r) =>
    setItems((list) => list.map((x) => (x.id === r.id ? { ...x, ...r } : x)));

  const addMany = async (floor, kind, count) => {
    const r = await api.post(`/settings/branches/${branch.id}/resources/bulk`, {
      floor,
      kind,
      count,
      prefix: KINDS[kind].label,
    });
    setItems((list) => [
      ...list.filter((x) => !r.data.data.some((n) => n.id === x.id)),
      ...r.data.data,
    ]);
    setEmptyFloors((f) => f.filter((x) => x !== floor));
    toast(
      count === 1
        ? `${r.data.data[0].name} added to ${floor}`
        : `${count} ${KINDS[kind].plural} added to ${floor}`,
    );
  };
  const addNamed = async (floor, kind, name) => {
    const r = await api.post(`/settings/branches/${branch.id}/resources`, {
      name,
      kind,
      floor,
      sortOrder: onFloor(floor).length,
    });
    setItems((list) => [
      ...list.filter((x) => x.id !== r.data.data.id),
      r.data.data,
    ]);
    setEmptyFloors((f) => f.filter((x) => x !== floor));
    toast(`${name} added`);
  };
  const update = async (r, data, msg) => {
    try {
      replace((await api.patch(`/settings/resources/${r.id}`, data)).data.data);
      if (msg) toast(msg);
      return true;
    } catch (e) {
      fail(e);
      return false;
    }
  };
  const move = async (floor, i, dir) => {
    const list = onFloor(floor);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    const before = items;
    const order = new Map(list.map((r, n) => [r.id, n]));
    setItems((all) =>
      all.map((r) =>
        order.has(r.id) ? { ...r, sortOrder: order.get(r.id) } : r,
      ),
    );
    try {
      await api.put(`/settings/branches/${branch.id}/resources/order`, {
        ids: list.map((r) => r.id),
      });
    } catch (e) {
      setItems(before);
      fail(e);
    }
  };
  const moveToFloor = (r, floor) =>
    update(
      r,
      { floor, sortOrder: onFloor(floor).length },
      `${r.name} moved to ${floor}`,
    );
  const renameFloor = async (from, to) => {
    if (!to || to === from) return true;
    if (!items.some((r) => r.floor === from)) {
      setEmptyFloors((f) => f.map((x) => (x === from ? to : x)));
      return true;
    }
    try {
      await api.post(`/settings/branches/${branch.id}/floors/rename`, {
        from,
        to,
      });
      setItems((list) =>
        list.map((r) => (r.floor === from ? { ...r, floor: to } : r)),
      );
      toast(`Renamed to ${to}`);
      return true;
    } catch (e) {
      fail(e);
      return false;
    }
  };
  const remove = async () => {
    const r = removing;
    try {
      await api.patch(`/settings/resources/${r.id}`, { isActive: false });
      setItems((list) => list.filter((x) => x.id !== r.id));
      toast(`${r.name} removed`);
      setRemoving(null);
    } catch (e) {
      fail(e);
      setRemoving(null);
    }
  };

  const seats = items.length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-stone-600">
          <LuLayers aria-hidden className="text-stone-400" />
          {floors.length ? (
            <>
              {floors.length} floor{floors.length === 1 ? "" : "s"} · {seats}{" "}
              seat{seats === 1 ? "" : "s"}
            </>
          ) : (
            "No floors yet"
          )}
        </p>
        {!addingFloor && (
          <Button size="sm" onClick={() => setAddingFloor(true)}>
            <LuPlus aria-hidden /> Add floor
          </Button>
        )}
      </div>

      {addingFloor && (
        <NewFloor
          existing={floors}
          onCancel={() => setAddingFloor(false)}
          onAdd={(name) => {
            setEmptyFloors((f) => [...f, name]);
            setAddingFloor(false);
          }}
        />
      )}

      {!floors.length && !addingFloor && (
        <div className="rounded-xl border-2 border-dashed border-stone-200 p-6 text-center">
          <p className="font-medium">Set up your floor plan</p>
          <p className="mt-1 text-sm text-stone-500">
            Add a floor, then the chairs, rooms and stations on it. They appear
            on the billing counter in this order.
          </p>
          <Button
            className="mt-3"
            variant="primary"
            onClick={() => addMany("Ground floor", "CHAIR", 4).catch(fail)}
          >
            <LuPlus aria-hidden /> Start with 4 chairs on the ground floor
          </Button>
        </div>
      )}

      {floors.map((floor) => (
        <FloorCard
          key={floor}
          floor={floor}
          list={onFloor(floor)}
          floors={floors}
          onRename={(to) => renameFloor(floor, to)}
          onAddMany={addMany}
          onAddNamed={addNamed}
          onUpdate={update}
          onMove={(i, dir) => move(floor, i, dir)}
          onMoveFloor={moveToFloor}
          onRemove={setRemoving}
          onError={fail}
        />
      ))}

      <p className="text-xs text-stone-500">
        Removing a chair hides it from the counter and from new bookings; past
        bookings and bills keep it, and adding the same name again brings it
        back. A chair with an open bill can’t be removed.
      </p>

      {removing && (
        <ConfirmDialog
          danger
          title={`Remove ${removing.name}?`}
          description="It disappears from the billing counter and from new bookings. Past bills and bookings keep it."
          confirmLabel="Remove"
          onConfirm={remove}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  );
}

function NewFloor({ existing, onAdd, onCancel }) {
  const [name, setName] = useState(
    FLOOR_SUGGESTIONS.find((f) => !existing.includes(f)) ?? "",
  );
  const taken = existing.includes(name.trim());
  const submit = (e) => {
    e.preventDefault();
    if (name.trim() && !taken) onAdd(name.trim());
  };
  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-rose-200 bg-rose-50/50 p-3"
    >
      <label htmlFor="new-floor" className="text-sm font-medium">
        Floor name
      </label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <input
          id="new-floor"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="e.g. First floor"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!name.trim() || taken}
        >
          Add floor
        </Button>
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {taken && (
        <p className="mt-1 text-xs text-rose-700">That floor already exists.</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {FLOOR_SUGGESTIONS.filter((f) => !existing.includes(f)).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setName(f)}
            className={cx(
              "rounded-full border px-2.5 py-1 text-xs",
              name === f
                ? "border-rose-300 bg-white text-rose-800"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
            )}
          >
            {f}
          </button>
        ))}
      </div>
    </form>
  );
}

function FloorCard({
  floor,
  list,
  floors,
  onRename,
  onAddMany,
  onAddNamed,
  onUpdate,
  onMove,
  onMoveFloor,
  onRemove,
  onError,
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(floor);
  const [kind, setKind] = useState(list.at(-1)?.kind ?? "CHAIR");
  const [count, setCount] = useState(1);
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  };
  const saveName = async (e) => {
    e.preventDefault();
    if (await onRename(name.trim())) setEditing(false);
  };

  return (
    <section
      className="rounded-xl border border-stone-200 bg-stone-50/60"
      aria-label={floor}
    >
      <header className="flex items-center justify-between gap-2 border-b border-stone-200 px-3 py-2.5">
        {editing ? (
          <form
            onSubmit={saveName}
            className="flex min-w-0 flex-1 items-center gap-1.5"
          >
            <input
              autoFocus
              aria-label="Floor name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-2 py-1 text-sm font-semibold"
            />
            <button
              type="submit"
              aria-label="Save floor name"
              disabled={!name.trim()}
              className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-50"
            >
              <LuCheck />
            </button>
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => {
                setName(floor);
                setEditing(false);
              }}
              className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
            >
              <LuX />
            </button>
          </form>
        ) : (
          <h3 className="flex min-w-0 items-center gap-2 font-semibold">
            <span className="truncate">{floor}</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-stone-500 ring-1 ring-stone-200">
              {list.length}
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Rename ${floor}`}
              className="rounded-md p-1 text-stone-400 hover:bg-white hover:text-stone-700"
            >
              <LuPencil size={14} />
            </button>
          </h3>
        )}
      </header>

      <div className="p-3">
        {list.length ? (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {list.map((r, i) => (
              <ChairTile
                key={r.id}
                r={r}
                first={i === 0}
                last={i === list.length - 1}
                floors={floors}
                onUpdate={onUpdate}
                onLeft={() => onMove(i, -1)}
                onRight={() => onMove(i, 1)}
                onMoveFloor={(f) => onMoveFloor(r, f)}
                onRemove={() => onRemove(r)}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-stone-300 bg-white p-4 text-center text-sm text-stone-500">
            No seats on this floor yet. Add some below — the floor is saved with
            its first seat.
          </p>
        )}

        {/* Add seats: quick numbered add, or one with a custom name */}
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-white p-2 ring-1 ring-stone-200">
          <span className="pl-1 text-sm font-medium text-stone-700">Add</span>
          <div className="flex items-center rounded-lg border border-stone-300">
            <button
              type="button"
              aria-label="Fewer"
              disabled={count <= 1}
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              className="p-2 text-stone-600 disabled:opacity-30"
            >
              <LuMinus size={14} />
            </button>
            <span
              className="num w-7 text-center text-sm font-semibold"
              aria-live="polite"
            >
              {count}
            </span>
            <button
              type="button"
              aria-label="More"
              disabled={count >= 30}
              onClick={() => setCount((c) => Math.min(30, c + 1))}
              className="p-2 text-stone-600 disabled:opacity-30"
            >
              <LuPlus size={14} />
            </button>
          </div>
          <div
            role="radiogroup"
            aria-label="Type"
            className="flex rounded-lg border border-stone-300 p-0.5"
          >
            {Object.entries(KINDS).map(([k, v]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={cx(
                  "flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium",
                  kind === k
                    ? "bg-rose-50 text-rose-800"
                    : "text-stone-600 hover:bg-stone-50",
                )}
              >
                <v.icon aria-hidden />{" "}
                {count > 1
                  ? v.plural.replace(/^./, (c) => c.toUpperCase())
                  : v.label}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="primary"
            loading={busy}
            onClick={() =>
              run(async () => {
                await onAddMany(floor, kind, count);
                setCount(1);
              })
            }
          >
            <LuPlus aria-hidden /> Add
          </Button>
          <button
            type="button"
            onClick={() => setShowCustom((v) => !v)}
            className="ml-auto text-xs font-semibold text-rose-700 underline-offset-2 hover:underline"
          >
            {showCustom ? "Hide" : "Custom name"}
          </button>
          {showCustom && (
            <form
              className="flex w-full gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (custom.trim())
                  run(async () => {
                    await onAddNamed(floor, kind, custom.trim());
                    setCustom("");
                  });
              }}
            >
              <input
                aria-label="Custom name"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                maxLength={60}
                placeholder={`e.g. ${
                  kind === "ROOM"
                    ? "Couple spa room"
                    : kind === "STATION"
                    ? "Pedicure station"
                    : "Bridal chair"
                }`}
                className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <Button type="submit" size="sm" disabled={!custom.trim() || busy}>
                Add {KINDS[kind].label.toLowerCase()}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function ChairTile({
  r,
  first,
  last,
  floors,
  onUpdate,
  onLeft,
  onRight,
  onMoveFloor,
  onRemove,
}) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(r.name);
  const [kind, setKind] = useState(r.kind);
  useEffect(() => {
    setName(r.name);
    setKind(r.kind);
  }, [r.name, r.kind]);
  const Icon = KINDS[r.kind]?.icon ?? LuArmchair;
  const save = async (e) => {
    e.preventDefault();
    const data = {};
    if (name.trim() && name.trim() !== r.name) data.name = name.trim();
    if (kind !== r.kind) data.kind = kind;
    if (!Object.keys(data).length || (await onUpdate(r, data, "Saved")))
      setEdit(false);
  };

  if (edit) {
    return (
      <li className="col-span-2 rounded-lg border border-rose-200 bg-white p-2 sm:col-span-1">
        <form onSubmit={save} className="space-y-2">
          <input
            autoFocus
            aria-label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm font-medium"
          />
          <select
            aria-label="Type"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
          >
            {Object.entries(KINDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          {floors.length > 1 && (
            <select
              aria-label="Floor"
              value={r.floor}
              onChange={(e) => {
                onMoveFloor(e.target.value);
                setEdit(false);
              }}
              className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
            >
              {floors.map((f) => (
                <option key={f} value={f}>
                  {f === r.floor ? `On ${f}` : `Move to ${f}`}
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-1.5">
            <Button
              type="submit"
              size="sm"
              variant="primary"
              className="flex-1"
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setName(r.name);
                setKind(r.kind);
                setEdit(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }
  return (
    <li className="group relative flex flex-col rounded-lg border border-stone-200 bg-white p-2.5 shadow-sm">
      <button
        type="button"
        onClick={() => setEdit(true)}
        className="flex min-w-0 items-center gap-2 text-left"
        aria-label={`Edit ${r.name}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-700">
          <Icon aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{r.name}</span>
          <span className="block text-[11px] text-stone-500">
            {KINDS[r.kind]?.label ?? r.kind}
          </span>
        </span>
      </button>
      <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-1.5">
        <div className="flex">
          <button
            type="button"
            disabled={first}
            onClick={onLeft}
            aria-label={`Move ${r.name} earlier`}
            className="rounded p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-25"
          >
            <LuChevronLeft size={16} />
          </button>
          <button
            type="button"
            disabled={last}
            onClick={onRight}
            aria-label={`Move ${r.name} later`}
            className="rounded p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-25"
          >
            <LuChevronRight size={16} />
          </button>
        </div>
        <div className="flex">
          <button
            type="button"
            onClick={() => setEdit(true)}
            aria-label={`Rename ${r.name}`}
            className="rounded p-1.5 text-stone-500 hover:bg-stone-100"
          >
            <LuPencil size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${r.name}`}
            className="rounded p-1.5 text-rose-700 hover:bg-rose-50"
          >
            <LuTrash2 size={14} />
          </button>
        </div>
      </div>
    </li>
  );
}
