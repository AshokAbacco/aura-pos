import { useState } from "react";
import { api, errorMessage } from "../../../../lib/api.js";
import { Button } from "../../../../components/ui";
import { Field } from "../../../../components/forms";
import { Modal } from "../../../../components/modals";

/** Move an open ticket to a free chair (the client changed seat). */
export function MoveChairModal({ chair, chairs, toast, onClose, onMoved }) {
  const free = chairs.filter((c) => !c.ticket && c.id !== chair.id);
  const [to, setTo] = useState(free[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const move = async () => {
    setBusy(true);
    try {
      await api.post(`/pos/chairs/${chair.id}/move`, { toResourceId: to });
      toast(`Moved to ${free.find((c) => c.id === to)?.name}`);
      onMoved();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`Move ${chair.name}`}
      description="The client’s items move with them. The old chair becomes free."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={busy}
            disabled={!to}
            onClick={move}
          >
            Move
          </Button>
        </>
      }
    >
      {free.length ? (
        <Field
          as="select"
          label="Move to"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        >
          {free.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.floor}
            </option>
          ))}
        </Field>
      ) : (
        <p className="text-sm text-stone-600">
          Every other chair is busy right now.
        </p>
      )}
    </Modal>
  );
}
