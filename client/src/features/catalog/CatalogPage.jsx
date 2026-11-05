/** Price list & stock: services and products, GST rates, archive/restore, restock. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import {
  Button,
  PageHeader,
  ErrorNote,
  Skeleton,
  Empty,
} from "../../components/ui";
import { useApi } from "../../hooks/useApi.js";
import { useToast } from "../../contexts/ToastContext.jsx";
import { addItemToDraft } from "../pos";
import { ConfirmDialog } from "../../components/modals";
import { CatalogTable } from "./components/CatalogTable.jsx";
import { ItemModal } from "./components/ItemModal.jsx";
import { RestockModal } from "../inventory";

export default function CatalogPage() {
  const { can, writable } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);
  const items = useApi(`/catalog/items?includeArchived=${showArchived}`);
  const categories = useApi("/catalog/categories");
  const [modal, setModal] = useState(null);
  const canEdit = can("catalog.manage") && writable;

  const setArchived = async (i, restore) => {
    try {
      await api.post(
        `/catalog/items/${i.id}/${restore ? "restore" : "archive"}`,
      );
      toast(restore ? `Restored ${i.name}` : `Archived ${i.name}`);
      items.reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
  const toggleArchive = (i) =>
    i.archivedAt
      ? setArchived(i, true)
      : setModal({ kind: "archive", item: i });
  const addButton = canEdit && (
    <Button variant="primary" onClick={() => setModal({ kind: "item" })}>
      New service or product
    </Button>
  );

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Price list & stock"
        subtitle="Services, retail products, GST rates and inventory."
        actions={
          <>
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />{" "}
              Show archived
            </label>
            {addButton}
          </>
        }
      />
      {items.error && (
        <ErrorNote onRetry={items.reload}>{items.error}</ErrorNote>
      )}
      {items.loading || categories.loading ? (
        <Skeleton />
      ) : !items.data?.length ? (
        <Empty title="Your price list is empty" action={addButton}>
          Add services and products to start billing.
        </Empty>
      ) : (
        <CatalogTable
          items={items.data}
          canBill={can("pos.bill")}
          canEdit={canEdit}
          canRestock={can("inventory.manage") && writable}
          onBill={(i) => {
            addItemToDraft(i);
            navigate("/app/pos/quick");
          }}
          onEdit={(i) => setModal({ kind: "item", item: i })}
          onRestock={(i) => setModal({ kind: "restock", item: i })}
          onArchive={toggleArchive}
        />
      )}
      {modal?.kind === "item" && (
        <ItemModal
          item={modal.item}
          categories={categories.data ?? []}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            items.reload();
          }}
        />
      )}
      {modal?.kind === "archive" && (
        <ConfirmDialog
          title={`Archive “${modal.item.name}”?`}
          description="It disappears from the billing counter. Past invoices keep it, and you can restore it any time."
          confirmLabel="Archive"
          danger
          onClose={() => setModal(null)}
          onConfirm={async () => {
            await setArchived(modal.item, false);
            setModal(null);
          }}
        />
      )}
      {modal?.kind === "restock" && (
        <RestockModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            items.reload();
          }}
        />
      )}
    </div>
  );
}
