import { useState } from "react";
import {
  LuMail,
  LuSmartphone,
  LuKeyRound,
  LuTriangleAlert,
} from "react-icons/lu";
import { errorMessage } from "../../../lib/api.js";
import { useToast } from "../../../contexts/ToastContext.jsx";
import { Button, ErrorNote, Skeleton } from "../../../components/ui";
import { cx } from "../../../utils/cx.js";
import { usePlatformApi } from "../hooks/usePlatformApi.js";
import { usePlatform } from "../hooks/usePlatformSession.js";
import { platformApi } from "../utils/platformApi.js";
import { PageTitle } from "../components/PageTitle.jsx";

const METHODS = [
  [
    "EMAIL",
    "Email only",
    "Salon owners and staff sign in with their email address.",
    LuMail,
  ],
  [
    "PHONE",
    "Mobile number only",
    "They sign in with their 10-digit mobile number. Email sign-in is turned off.",
    LuSmartphone,
  ],
  [
    "BOTH",
    "Email or mobile number",
    "One box accepts either. Recommended if some staff have no email they check.",
    LuKeyRound,
  ],
];

/** Platform-wide settings. Today: how salon users sign in. */
export default function SettingsPage() {
  const { isSuper } = usePlatform();
  const toast = useToast();
  const s = usePlatformApi("/settings");
  const [busy, setBusy] = useState(null);
  const choose = async (m) => {
    setBusy(m);
    try {
      await platformApi.put("/settings", { loginMethod: m });
      toast("Sign-in method saved. The login page updates within a minute.");
      s.reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };
  if (s.error && !s.data)
    return <ErrorNote onRetry={s.reload}>{s.error}</ErrorNote>;
  if (!s.data) return <Skeleton rows={4} />;
  const d = s.data;
  return (
    <>
      <PageTitle
        title="Settings"
        sub={
          isSuper
            ? "Changes apply to every salon."
            : "Only a super admin can change these."
        }
      />
      <section className="max-w-3xl rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold">How salon users sign in</h2>
        <p className="mt-0.5 text-sm text-stone-500">
          Applies to the website and the Android / iOS apps. Password reset is
          always by email.
        </p>
        <div
          className="mt-4 grid gap-3 md:grid-cols-3"
          role="radiogroup"
          aria-label="Sign-in method"
        >
          {METHODS.map(([k, l, help, Icon]) => (
            <button
              key={k}
              role="radio"
              aria-checked={d.loginMethod === k}
              disabled={!isSuper || busy}
              onClick={() => d.loginMethod !== k && choose(k)}
              className={cx(
                "rounded-xl border-2 p-4 text-left transition disabled:cursor-not-allowed",
                d.loginMethod === k
                  ? "border-rose-600 bg-rose-50/50"
                  : "border-stone-200 hover:border-stone-300",
              )}
            >
              <Icon
                className={
                  d.loginMethod === k ? "text-rose-700" : "text-stone-500"
                }
                size={20}
                aria-hidden
              />
              <p className="mt-2 font-semibold">
                {l}
                {d.loginMethod === k && (
                  <span className="ml-2 text-xs font-medium text-rose-700">
                    In use
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-stone-600">{help}</p>
              {busy === k && (
                <p className="mt-1 text-xs text-stone-500">Saving…</p>
              )}
            </button>
          ))}
        </div>
        {(d.usersWithoutPhone > 0 || d.sharedPhones > 0) && (
          <div className="mt-4 flex gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <LuTriangleAlert className="mt-0.5 shrink-0" aria-hidden />
            <div>
              {d.usersWithoutPhone > 0 && (
                <p>
                  <b>{d.usersWithoutPhone}</b> active user
                  {d.usersWithoutPhone === 1 ? " has" : "s have"} no mobile
                  number. With “Mobile number only” they could not sign in —
                  prefer “Email or mobile number”.
                </p>
              )}
              {d.sharedPhones > 0 && (
                <p className="mt-1">
                  <b>{d.sharedPhones}</b> mobile number
                  {d.sharedPhones === 1 ? " is" : "s are"} shared by more than
                  one account; those people must sign in with email.
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
