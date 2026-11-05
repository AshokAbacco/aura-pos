import { useState } from "react";
import { FiSearch, FiInbox } from "react-icons/fi";
import { money } from "../../../utils/format.js";
import { Button, ErrorNote, Skeleton } from "../../../components/ui";
import { cx } from "../../../utils/cx.js";

/** Catalogue: search, category pills and the tappable service/product cards (quick sale and chair screens). */
export function CatalogPanel({ catalog, categories, onAdd, onOpenParked }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const items = (catalog.data ?? []).filter(
    (i) =>
      (cat === "all" || i.category.id === cat) &&
      (!q ||
        `${i.name} ${i.category.name} ${i.sku ?? ""}`
          .toLowerCase()
          .includes(q.toLowerCase())),
  );

  return (
    <section
      className="flex min-w-0 flex-1 flex-col p-4"
      aria-label="Catalogue"
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <FiSearch
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search services, products, SKU or barcode"
            aria-label="Search catalogue"
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm"
          />
        </div>
        {onOpenParked && (
          <Button onClick={onOpenParked}>
            <FiInbox /> Parked bills
          </Button>
        )}
      </div>
      <div
        className="mb-3 flex gap-1.5 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Categories"
      >
        {[{ id: "all", name: "All" }, ...(categories ?? [])].map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={cat === c.id}
            onClick={() => setCat(c.id)}
            className={cx(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium",
              cat === c.id
                ? "bg-stone-900 text-white"
                : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      {catalog.error && (
        <ErrorNote onRetry={catalog.reload}>{catalog.error}</ErrorNote>
      )}
      {catalog.loading ? (
        <Skeleton rows={6} />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 overflow-y-auto pb-24 sm:grid-cols-3 xl:grid-cols-4 lg:pb-4">
          {items.map((i) => (
            <CatalogCard key={i.id} item={i} onAdd={onAdd} />
          ))}
          {!items.length && (
            <p className="col-span-full py-10 text-center text-sm text-stone-500">
              Nothing matches “{q}”.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function CatalogCard({ item: i, onAdd }) {
  const out = i.type === "PRODUCT" && i.stock <= 0;
  return (
    <button
      disabled={out}
      onClick={() => onAdd(i)}
      className="group flex min-h-28 flex-col justify-between rounded-xl border border-stone-200 bg-white p-3 text-left transition hover:border-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>
        <span className="block text-sm font-semibold leading-tight text-stone-900 group-hover:text-rose-800">
          {i.name}
        </span>
        <span className="mt-1 block text-xs text-stone-500">
          {i.category.name}
        </span>
      </span>
      <span className="mt-3 flex items-baseline justify-between border-t border-stone-100 pt-2">
        <span className="num text-sm font-bold">{money(i.price)}</span>
        <span
          className={cx(
            "text-xs",
            i.lowStock ? "font-semibold text-rose-700" : "text-stone-500",
          )}
        >
          {i.type === "SERVICE"
            ? `${i.durationMin} min`
            : out
              ? "Out of stock"
              : `${i.stock} in stock`}
        </span>
      </span>
    </button>
  );
}
