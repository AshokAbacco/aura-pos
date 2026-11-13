import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  LuArrowLeft,
  LuPhone,
  LuMail,
  LuMessageCircle,
  LuLogOut,
  LuMonitorSmartphone,
} from "react-icons/lu";
import { errorMessage } from "../../../lib/api.js";
import { date, dateTime, money } from "../../../utils/format.js";
import { useToast } from "../../../contexts/ToastContext.jsx";
import { Badge, Button, ErrorNote, Skeleton } from "../../../components/ui";
import { ConfirmDialog } from "../../../components/modals";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { platformApi } from "../utils/platformApi.js";
import { PageTitle } from "../components/PageTitle.jsx";
import { ActivityList } from "../components/ActivityList.jsx";
import { ROLE_LABEL } from "../utils/platform.constants.js";

const device = (ua) => {
  if (!ua) return "Unknown device";
  const os = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad/i.test(ua)
    ? "iPhone / iPad"
    : /Windows/i.test(ua)
    ? "Windows"
    : /Mac OS/i.test(ua)
    ? "Mac"
    : /Linux/i.test(ua)
    ? "Linux"
    : "Device";
  const app = /wv\)|Capacitor/i.test(ua)
    ? "Salora Glam app"
    : /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
    ? "Chrome"
    : /Safari\//.test(ua)
    ? "Safari"
    : /Firefox\//.test(ua)
    ? "Firefox"
    : "Browser";
  return `${app} on ${os}`;
};
function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-stone-100 py-2 text-sm last:border-0">
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-medium">{children ?? "—"}</span>
    </div>
  );
}

/** One person in a salon: login details, access, staff record, signed-in devices, what they did. */
export default function SalonUserPage() {
  const { id, userId } = useParams();
  const toast = useToast();
  const u = usePlatformApi(`/tenants/${id}/users/${userId}`);
  const salon = usePlatformApi(`/tenants/${id}`);
  const [confirm, setConfirm] = useState(false);
  if (u.error && !u.data)
    return <ErrorNote onRetry={u.reload}>{u.error}</ErrorNote>;
  if (!u.data) return <Skeleton rows={6} />;
  const p = u.data;
  const s = p.staffProfile;
  return (
    <>
      <Link
        to={`/platform/salons/${id}?tab=team`}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
      >
        <LuArrowLeft aria-hidden /> {salon.data?.displayName ?? "Salon"} · team
      </Link>
      <PageTitle
        title={p.name}
        sub={`${ROLE_LABEL[p.role] ?? p.role} at ${
          salon.data?.displayName ?? "…"
        } · added ${date(p.createdAt)}`}
      >
        {p.phone && (
          <a
            href={`tel:${p.phone}`}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold"
          >
            <LuPhone aria-hidden /> Call
          </a>
        )}
        {p.phone && (
          <a
            href={`https://wa.me/${p.phone
              .replace(/\D/g, "")
              .replace(/^(\d{10})$/, "91$1")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-700"
          >
            <LuMessageCircle aria-hidden /> WhatsApp
          </a>
        )}
        <a
          href={`mailto:${p.email}`}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold"
        >
          <LuMail aria-hidden /> Email
        </a>
        <Button onClick={() => setConfirm(true)} disabled={!p.sessions.length}>
          <LuLogOut aria-hidden /> Sign out everywhere
        </Button>
      </PageTitle>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="mb-2 font-semibold">Account</h2>
          <Row label="Email">{p.email}</Row>
          <Row label="Phone">{p.phone}</Row>
          <Row label="Status">
            {p.isActive ? (
              <Badge tone="green">Active</Badge>
            ) : (
              <Badge tone="stone">Disabled</Badge>
            )}
          </Row>
          <Row label="Email verified">
            {p.emailVerifiedAt ? date(p.emailVerifiedAt) : "Not yet"}
          </Row>
          <Row label="Password set">
            {p.hasPassword ? "Yes" : "No (invite not accepted)"}
          </Row>
          <Row label="Last sign-in">
            {p.lastLoginAt ? dateTime(p.lastLoginAt) : "Never"}
          </Row>
          <Row label="Branches">{p.branchNames.join(", ") || "None"}</Row>
          {(p.permissionGrants.length > 0 ||
            p.permissionRevokes.length > 0) && (
            <Row label="Custom access">
              {[
                ...p.permissionGrants.map((x) => `+${x}`),
                ...p.permissionRevokes.map((x) => `−${x}`),
              ].join(", ")}
            </Row>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="mb-2 font-semibold">Work</h2>
          <Row label="Actions, last 30 days">{p.actionsLast30Days}</Row>
          <Row label="Bills made, 30 days">{p.billsLast30Days}</Row>
          <Row label="Billed, 30 days">{money(p.billedLast30Days)}</Row>
          {s ? (
            <>
              <Row label="Designation">{s.designation}</Row>
              <Row label="Joined">{s.joinedOn ? date(s.joinedOn) : null}</Row>
              <Row label="Staff status">{s.status}</Row>
              <Row label="Takes bookings">{s.isBookable ? "Yes" : "No"}</Row>
              <Row label="Commission">{`${s.serviceCommission}% services · ${s.productCommission}% products`}</Row>
            </>
          ) : (
            <p className="mt-2 text-xs text-stone-500">
              No staff record linked to this login.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <LuMonitorSmartphone aria-hidden /> Signed in on
          </h2>
          {p.sessions.length ? (
            <ul className="divide-y divide-stone-100 text-sm">
              {p.sessions.map((x) => (
                <li key={x.id} className="py-2">
                  <p className="font-medium">{device(x.userAgent)}</p>
                  <p className="text-xs text-stone-500">
                    Last used {dateTime(x.lastUsedAt)} · since{" "}
                    {date(x.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-500">Not signed in anywhere.</p>
          )}
        </section>
      </div>

      <h2 className="mb-2 mt-6 font-semibold">
        What {p.name.split(" ")[0]} did
      </h2>
      <ActivityList tenantId={id} userId={userId} pageSize={30} filters />

      {confirm && (
        <ConfirmDialog
          danger
          minReason={5}
          reasonLabel="Reason (kept in the activity log)"
          reasonPlaceholder="Owner reported a lost phone"
          title={`Sign ${p.name} out of every device?`}
          description="They will need to sign in again with their password. Nothing else changes."
          confirmLabel="Sign out everywhere"
          onConfirm={async (reason) => {
            try {
              await platformApi.post(
                `/tenants/${id}/users/${userId}/sign-out`,
                { reason },
              );
              toast("Signed out everywhere");
              setConfirm(false);
              u.reload();
            } catch (e) {
              toast(errorMessage(e), "error");
            }
          }}
          onClose={() => setConfirm(false)}
        />
      )}
    </>
  );
}
