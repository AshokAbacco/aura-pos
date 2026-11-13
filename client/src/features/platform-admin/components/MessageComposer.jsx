import { useState } from "react";
import { LuMail, LuBell } from "react-icons/lu";
import { errorMessage } from "../../../lib/api.js";
import { useToast } from "../../../contexts/ToastContext.jsx";
import { Button } from "../../../components/ui";
import { Field } from "../../../components/forms";
import { Modal } from "../../../components/modals";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { platformApi } from "../utils/platformApi.js";
import {
  MESSAGE_KINDS,
  MESSAGE_TEMPLATES,
  STATE_LABEL,
} from "../utils/platform.constants.js";

/**
 * Send a message to salons: it appears in the bell of their Salora Glam app, and with "Also email"
 * it is emailed to each owner. `preset` fixes the audience, e.g. { audience: 'selected', tenantIds, names }.
 */
export function MessageComposer({
  preset,
  kind: initialKind = "RENEWAL",
  onClose,
  onSent,
}) {
  const toast = useToast();
  const plans = usePlatformApi(preset ? null : "/plans");
  const [kind, setKind] = useState(initialKind);
  const [f, setF] = useState({
    ...MESSAGE_TEMPLATES[initialKind],
    email: true,
    audience: preset?.audience ?? "expiring",
    state: "EXPIRED",
    planId: "",
    expiresWithin: 7,
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) =>
    setF((x) => ({
      ...x,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  const pickKind = (k) => {
    setKind(k);
    setF((x) => ({ ...x, ...MESSAGE_TEMPLATES[k] }));
  };

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        kind,
        title: f.title,
        body: f.body,
        link: f.link,
        email: f.email,
        audience: f.audience,
        ...(preset?.tenantIds ? { tenantIds: preset.tenantIds } : {}),
        ...(f.audience === "state" ? { state: f.state } : {}),
        ...(f.audience === "plan" ? { planId: f.planId } : {}),
        ...(f.audience === "expiring"
          ? { expiresWithin: Number(f.expiresWithin) }
          : {}),
      };
      const r = await platformApi.post("/messages", body);
      toast(
        `Sent to ${r.data.data.recipients} salon${
          r.data.data.recipients === 1 ? "" : "s"
        }${f.email ? ` · ${r.data.data.emailed} emailed` : ""}`,
      );
      onSent?.(r.data.data);
      onClose();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title="Message salons"
      description="Shows in the bell of their Salora Glam app. Owners can also get it by email."
    >
      <form onSubmit={send} className="space-y-4">
        <div
          role="radiogroup"
          aria-label="Type"
          className="flex flex-wrap gap-1.5"
        >
          {Object.entries(MESSAGE_KINDS).map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => pickKind(k)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${
                kind === k
                  ? "bg-rose-700 text-white ring-rose-700"
                  : "bg-white text-stone-700 ring-stone-200 hover:ring-stone-300"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {preset?.names ? (
          <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm">
            To:{" "}
            <b>
              {preset.names.length > 3
                ? `${preset.names.slice(0, 3).join(", ")} and ${
                    preset.names.length - 3
                  } more`
                : preset.names.join(", ")}
            </b>
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
            <Field
              as="select"
              label="Send to"
              value={f.audience}
              onChange={set("audience")}
            >
              <option value="expiring">Salons whose plan ends within…</option>
              <option value="state">Salons by access state</option>
              <option value="plan">Salons on a plan</option>
              <option value="all">All salons</option>
            </Field>
            {f.audience === "expiring" && (
              <Field
                type="number"
                min={0}
                max={365}
                label="Days"
                value={f.expiresWithin}
                onChange={set("expiresWithin")}
              />
            )}
            {f.audience === "state" && (
              <Field
                as="select"
                label="Access state"
                value={f.state}
                onChange={set("state")}
              >
                {Object.entries(STATE_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Field>
            )}
            {f.audience === "plan" && (
              <Field
                as="select"
                label="Plan"
                value={f.planId}
                onChange={set("planId")}
              >
                <option value="">Choose a plan</option>
                {(plans.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Field>
            )}
          </div>
        )}

        <Field
          label="Title"
          value={f.title}
          onChange={set("title")}
          maxLength={120}
          required
        />
        <Field
          as="textarea"
          rows={5}
          label="Message"
          value={f.body}
          onChange={set("body")}
          maxLength={2000}
          required
        />
        <Field
          label="Button link (optional)"
          value={f.link}
          onChange={set("link")}
          placeholder="/app/subscription"
          hint="A page in the app (starts with /) or a website (https://…)."
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.email}
            onChange={set("email")}
            className="h-4 w-4 accent-rose-700"
          />
          <LuMail aria-hidden className="text-stone-500" /> Also email it to
          each salon owner
        </label>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <LuBell aria-hidden /> Preview in the salon app
          </p>
          <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-stone-200">
            <p className="font-semibold">{f.title || "Title"}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">
              {f.body || "Your message…"}
            </p>
            {f.link && (
              <span className="mt-2 inline-block text-sm font-semibold text-rose-700">
                Open →
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={busy}
            disabled={
              !f.title.trim() ||
              !f.body.trim() ||
              (f.audience === "plan" && !f.planId && !preset)
            }
          >
            Send
          </Button>
        </div>
      </form>
    </Modal>
  );
}
