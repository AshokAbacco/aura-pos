import { useState } from "react";
import { Navigate } from "react-router-dom";
import { LuUserPlus } from "react-icons/lu";
import { errorMessage } from "../../../lib/api.js";
import { dateTime } from "../../../utils/format.js";
import { useToast } from "../../../contexts/ToastContext.jsx";
import { Badge, Button, ErrorNote, Skeleton } from "../../../components/ui";
import { Field } from "../../../components/forms";
import { Modal } from "../../../components/modals";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { usePlatform } from "../hooks/usePlatformSession.js";
import { platformApi } from "../utils/platformApi.js";
import { PageTitle } from "../components/PageTitle.jsx";
import { ADMIN_ROLE_LABEL } from "../utils/platform.constants.js";

const ROLE_HELP = {
  SUPPORT:
    "Sees every salon, searches, keeps notes and follow-ups, messages salons, signs a salon user out. Cannot change plans, extend, suspend, or manage the team.",
  SUPER_ADMIN:
    "Everything, including extending and changing plans, suspending salons, editing plans, the platform team and settings.",
};

/** The people who can sign in to the platform admin (super admins and the support team). */
export default function TeamPage() {
  const { isSuper, admin: me } = usePlatform();
  const toast = useToast();
  const list = usePlatformApi(isSuper ? "/admins" : null);
  const [edit, setEdit] = useState(null); // 'new' | admin
  const [f, setF] = useState({});
  const [busy, setBusy] = useState(false);
  if (!isSuper) return <Navigate to="/platform" replace />;

  const open = (a) => {
    setEdit(a);
    setF(
      a === "new"
        ? { role: "SUPPORT", name: "", email: "", phone: "", password: "" }
        : {
            role: a.role,
            name: a.name,
            phone: a.phone ?? "",
            password: "",
            isActive: a.isActive,
          },
    );
  };
  const set = (k) => (e) =>
    setF((x) => ({
      ...x,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (edit === "new") await platformApi.post("/admins", f);
      else
        await platformApi.patch(`/admins/${edit.id}`, {
          name: f.name,
          phone: f.phone,
          role: f.role,
          isActive: f.isActive,
          ...(f.password ? { password: f.password } : {}),
        });
      toast(
        edit === "new"
          ? `Added ${f.name}. Share the password with them securely.`
          : "Saved",
      );
      setEdit(null);
      list.reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Platform team"
        sub="Who can sign in here. Give your customer support staff the Support role."
      >
        <Button variant="primary" onClick={() => open("new")}>
          <LuUserPlus aria-hidden /> Add member
        </Button>
      </PageTitle>
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        {Object.entries(ROLE_HELP).map(([k, v]) => (
          <div
            key={k}
            className="rounded-xl border border-stone-200 bg-white p-4 text-sm"
          >
            <p className="font-semibold">{ADMIN_ROLE_LABEL[k]}</p>
            <p className="mt-1 text-stone-600">{v}</p>
          </div>
        ))}
      </div>
      {list.error && <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>}
      {list.loading ? (
        <Skeleton />
      ) : (
        <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
          {(list.data ?? []).map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span>
                <b>{a.name}</b>
                {a.id === me.id && (
                  <span className="text-xs text-stone-500"> (you)</span>
                )}{" "}
                <Badge tone={a.role === "SUPER_ADMIN" ? "rose" : "blue"}>
                  {ADMIN_ROLE_LABEL[a.role]}
                </Badge>
                {!a.isActive && <Badge tone="stone">disabled</Badge>}
                <span className="block text-xs text-stone-500">
                  {a.email}
                  {a.phone ? ` · ${a.phone}` : ""} · last sign-in{" "}
                  {a.lastLoginAt ? dateTime(a.lastLoginAt) : "never"}
                </span>
              </span>
              <Button size="sm" onClick={() => open(a)}>
                Edit
              </Button>
            </li>
          ))}
        </ul>
      )}
      {edit && (
        <Modal
          open
          onClose={() => setEdit(null)}
          title={edit === "new" ? "Add a team member" : `Edit ${edit.name}`}
          description={
            edit === "new"
              ? "They sign in at /platform with this email and password."
              : "Changing the role, password or access signs them out everywhere."
          }
        >
          <form onSubmit={save} className="space-y-3">
            <Field
              label="Name"
              value={f.name}
              onChange={set("name")}
              required
            />
            {edit === "new" && (
              <Field
                type="email"
                label="Email (sign-in)"
                value={f.email}
                onChange={set("email")}
                required
              />
            )}
            <Field label="Phone" value={f.phone} onChange={set("phone")} />
            <Field
              as="select"
              label="Role"
              value={f.role}
              onChange={set("role")}
              hint={ROLE_HELP[f.role]}
            >
              <option value="SUPPORT">Support</option>
              <option value="SUPER_ADMIN">Super admin</option>
            </Field>
            <Field
              type="password"
              autoComplete="new-password"
              label={
                edit === "new"
                  ? "Password"
                  : "New password (leave empty to keep)"
              }
              value={f.password}
              onChange={set("password")}
              minLength={edit === "new" ? 12 : undefined}
              required={edit === "new"}
              hint="At least 12 characters."
            />
            {edit !== "new" && edit.id !== me.id && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={f.isActive}
                  onChange={set("isActive")}
                  className="h-4 w-4 accent-rose-700"
                />{" "}
                Can sign in
              </label>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={busy}>
                {edit === "new" ? "Add member" : "Save"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
