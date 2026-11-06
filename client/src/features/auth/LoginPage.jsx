import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { AuthLayout, FormError } from "./components/AuthLayout.jsx";
import { AuthInput, AuthSubmit } from "./components/AuthInput.jsx";

const schema = z.object({
  email: z.string().email("Enter your email"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
});

const HERO = {
  eyebrow: "Welcome back",
  title: ["Welcome back", "to Salora Glam"],
  accentLine: -1,
  body: "Sign in to manage your salon’s appointments, billing, clients, staff and business all in one place.",
  points: [
    [
      "calendar",
      "Manage Appointments",
      "Keep your schedule organized and your clients happy.",
    ],
    [
      "card",
      "Easy Billing",
      "Accept cash, card, UPI and more with GST-ready invoicing.",
    ],
    [
      "users",
      "Grow Your Business",
      "Manage clients, staff and reports to take your salon further.",
    ],
  ],
  image: "authLoginSalon",
};

export default function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const [err, setErr] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  });
  if (status === "authed") return <Navigate to="/app" replace />;
  const submit = handleSubmit(async (v) => {
    setErr("");
    try {
      await login(v.email, v.password, v.remember);
      navigate("/app");
    } catch (e) {
      setErr(errorMessage(e));
    }
  });
  return (
    <AuthLayout
      hero={{
        ...HERO,
        title: [
          "Welcome back",
          <>
            to <span className="text-mauve">SALORA GLAM</span>
          </>,
        ],
      }}
      title="Sign in"
      subtitle="To your salon’s billing counter."
      footer={
        <>
          New to SALORA GLAM?{" "}
          <Link
            className="font-semibold text-mauve underline underline-offset-2"
            to="/register"
          >
            Start a free trial
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError msg={err} />
        <AuthInput
          label="Email"
          icon="mail"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          {...register("email")}
          error={errors.email?.message}
        />
        <AuthInput
          label="Password"
          icon="lock"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          {...register("password")}
          error={errors.password?.message}
        />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--color-mauve)]"
              {...register("remember")}
            />{" "}
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="font-medium text-mauve hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <AuthSubmit busy={isSubmitting} arrow={false}>
          Sign in
        </AuthSubmit>
      </form>
    </AuthLayout>
  );
}
