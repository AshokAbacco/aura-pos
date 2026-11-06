import { useState } from "react";
import { Link } from "react-router-dom";
import { LuLock, LuMail, LuMailCheck } from "react-icons/lu";
import { api } from "../../lib/api.js";
import { AuthLayout } from "./components/AuthLayout.jsx";
import { AuthInput, AuthSubmit } from "./components/AuthInput.jsx";

const HERO = {
  eyebrow: null,
  title: ["Get back to", "your business", "in no time"],
  accentLine: 2,
  body: "Reset your password and continue managing your appointments, clients, staff and billing with Salora Glam.",
  points: [
    ["mail", "Secure Reset Link", "We’ll send a secure link to your email."],
    ["shield", "Your Data Stays Safe", "Your information is always protected."],
    ["refresh", "Quick Access", "Get back to your account in minutes."],
  ],
  image: "authResetSalon",
};

/** Always shows the same confirmation, so the page never reveals whether an email has an account. */
export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await api.post("/auth/forgot-password", { email }).catch(() => {});
    setSent(true);
    setBusy(false);
  };
  const icon = (
    <div className="relative mx-auto mb-5 grid h-28 w-28 place-items-center rounded-full bg-petal">
      {sent ? (
        <LuMailCheck size={52} className="text-mauve" />
      ) : (
        <LuMail size={52} className="text-mauve" />
      )}
      {!sent && (
        <span className="absolute bottom-5 right-4 grid h-9 w-9 place-items-center rounded-full bg-mauve text-white ring-4 ring-petal">
          <LuLock size={16} />
        </span>
      )}
    </div>
  );
  return (
    <AuthLayout
      hero={HERO}
      centered
      cardTop={icon}
      title={sent ? "Check your email" : "Reset your password"}
      subtitle={
        sent
          ? `If an account exists for ${email}, we’ve emailed a reset link. It expires in 30 minutes.`
          : "Enter your work email and we’ll send you a secure reset link."
      }
    >
      {!sent && (
        <form onSubmit={submit} className="space-y-4">
          <AuthInput
            label="Email"
            icon="mail"
            type="email"
            required
            autoComplete="email"
            placeholder="Enter your work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthSubmit busy={busy}>Email me a reset link</AuthSubmit>
        </form>
      )}
      {sent && (
        <button
          type="button"
          onClick={() => setSent(false)}
          className="w-full rounded-xl border border-mauve/40 py-3 text-sm font-semibold text-mauve hover:bg-petal"
        >
          Use a different email
        </button>
      )}
      <div className="mt-6 flex items-center gap-3 text-sm text-stone-600">
        <span className="h-px flex-1 bg-blush" />
        <span className="flex items-center gap-1.5">
          <LuLock size={14} />
          Secure password recovery
        </span>
        <span className="h-px flex-1 bg-blush" />
      </div>
      <Link
        to="/login"
        className="mt-5 block text-center text-sm font-semibold text-mauve hover:underline"
      >
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
