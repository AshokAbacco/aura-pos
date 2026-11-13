import { useState } from "react";
import { errorMessage } from "../../../lib/api.js";
import { useToast } from "../../../contexts/ToastContext.jsx";
import { Button } from "../../../components/ui";
import { platformApi } from "../utils/platformApi.js";
import { NOTE_KINDS } from "../utils/platform.constants.js";
import { cx } from "../../../utils/cx.js";

const inDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(10, 0, 0, 0);
  return d;
};
const toInput = (d) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

/** Log a call / note / issue on a salon, optionally with a follow-up date (shows on Renewals & follow-ups). */
export function NoteComposer({ tenantId, onAdded, compact }) {
  const toast = useToast();
  const [kind, setKind] = useState("CALL");
  const [body, setBody] = useState("");
  const [follow, setFollow] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await platformApi.post(`/tenants/${tenantId}/notes`, {
        kind,
        body,
        followUpAt: follow
          ? new Date(`${follow}T10:00:00`).toISOString()
          : null,
      });
      setBody("");
      setFollow("");
      toast(follow ? "Saved — follow-up scheduled" : "Note saved");
      onAdded?.(r.data.data);
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      onSubmit={submit}
      className={cx(
        "space-y-2.5 rounded-xl border border-stone-200 bg-white p-3",
        compact && "border-0 p-0",
      )}
    >
      <div
        className="flex flex-wrap gap-1.5"
        role="radiogroup"
        aria-label="Type"
      >
        {Object.entries(NOTE_KINDS).map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={cx(
              "rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
              kind === k
                ? "bg-stone-900 text-white ring-stone-900"
                : "bg-white text-stone-600 ring-stone-200",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        required
        minLength={2}
        maxLength={4000}
        aria-label="Note"
        placeholder={
          kind === "CALL"
            ? "Called owner — will renew next week, wants annual price."
            : kind === "ISSUE"
            ? "Printer not printing receipts on Android."
            : "What happened?"
        }
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-stone-500">Follow up</span>
        {[
          ["Tomorrow", 1],
          ["3 days", 3],
          ["1 week", 7],
        ].map(([l, n]) => (
          <button
            key={l}
            type="button"
            onClick={() => setFollow(toInput(inDays(n)))}
            className={cx(
              "rounded-full px-2.5 py-1 text-xs ring-1",
              follow === toInput(inDays(n))
                ? "bg-rose-50 text-rose-800 ring-rose-200"
                : "ring-stone-200 text-stone-600",
            )}
          >
            {l}
          </button>
        ))}
        <input
          type="date"
          aria-label="Follow-up date"
          value={follow}
          min={toInput(new Date())}
          onChange={(e) => setFollow(e.target.value)}
          className="rounded-md border border-stone-300 px-2 py-1 text-xs"
        />
        {follow && (
          <button
            type="button"
            onClick={() => setFollow("")}
            className="text-xs text-stone-500 underline"
          >
            No follow-up
          </button>
        )}
        <Button
          type="submit"
          size="sm"
          variant="primary"
          className="ml-auto"
          loading={busy}
          disabled={body.trim().length < 2}
        >
          Save
        </Button>
      </div>
    </form>
  );
}
