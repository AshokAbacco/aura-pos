import { useState } from "react";
import { errorMessage } from "../../../lib/api.js";
import { Button } from "../../../components/ui";
import { Field } from "../../../components/forms";

export function AdminLogin({ onLogin }) {
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await onLogin(f.email, f.password);
    } catch (x) {
      setErr(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-stone-900 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-rose-700">
            Salora Glam
          </p>
          <h1 className="font-display text-2xl font-bold">Platform admin</h1>
          <p className="mt-1 text-sm text-stone-600">
            For the people who run the Salora Glam service. Salon owners sign in
            at /login.
          </p>
        </div>
        <Field
          label="Email"
          type="email"
          autoComplete="username"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
          required
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
          required
        />
        {err && (
          <p role="alert" className="text-sm text-rose-700">
            {err}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={busy}
        >
          Sign in
        </Button>
      </form>
    </main>
  );
}
