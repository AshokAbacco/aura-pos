import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LuMail, LuSmartphone } from "react-icons/lu";
import { errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { cx } from "../../utils/cx.js";
import { AuthLayout, FormError } from "./components/AuthLayout.jsx";
import { AuthInput, AuthSubmit } from "./components/AuthInput.jsx";
import { useLoginMethod } from "./hooks/useLoginMethod.js";

/** One schema; the identifier rule follows the field currently shown (email or mobile). */
const makeSchema = (modeRef) =>
  z
    .object({
      identifier: z.string().trim(),
      password: z.string().min(1, "Enter your password"),
      remember: z.boolean(),
    })
    .superRefine((v, ctx) => {
      if (
        modeRef.current === "phone" &&
        v.identifier.replace(/\D/g, "").length < 10
      )
        ctx.addIssue({
          code: "custom",
          path: ["identifier"],
          message: "Enter your 10-digit mobile number",
        });
      if (
        modeRef.current === "email" &&
        !z.email().safeParse(v.identifier).success
      )
        ctx.addIssue({
          code: "custom",
          path: ["identifier"],
          message: "Enter your email address",
        });
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

/**
 * Sign in with email, mobile number, or either — whichever the platform admin has chosen
 * (Platform admin → Settings). With "either", a switch above the field picks Email or Mobile.
 */
export default function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const method = useLoginMethod();
  const [mode, setModeState] = useState(method === "PHONE" ? "phone" : "email");
  const modeRef = useRef(mode);
  const setMode = (m) => {
    modeRef.current = m;
    setModeState(m);
  };
  const schema = useMemo(() => makeSchema(modeRef), []);
  useEffect(() => {
    if (method === "PHONE") setMode("phone");
    if (method === "EMAIL") setMode("email");
  }, [method]);
  const [err, setErr] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { remember: true, identifier: "" },
  });
  if (status === "authed") return <Navigate to="/app" replace />;

  const switchTo = (m) => {
    if (m === mode) return;
    setErr("");
    setMode(m);
    reset({ ...getValues(), identifier: "" });
  };
  const submit = handleSubmit(async (v) => {
    setErr("");
    const identifier =
      mode === "phone"
        ? v.identifier.replace(/\D/g, "").slice(-10)
        : v.identifier;
    try {
      await login(identifier, v.password, v.remember);
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
            to <span className="text-mauve">Salora Glam</span>
          </>,
        ],
      }}
      title="Sign in"
      subtitle={
        method === "PHONE"
          ? "Use your mobile number and password."
          : method === "BOTH"
          ? "Use your email or mobile number."
          : "To your salon’s billing counter."
      }
      footer={
        <>
          New to Salora Glam?{" "}
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
        {method === "BOTH" && (
          <div
            role="tablist"
            aria-label="Sign in with"
            className="grid grid-cols-2 gap-1 rounded-xl bg-petal/70 p-1 ring-1 ring-blush"
          >
            {[
              ["email", "Email", LuMail],
              ["phone", "Mobile number", LuSmartphone],
            ].map(([k, l, Icon]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={mode === k}
                onClick={() => switchTo(k)}
                className={cx(
                  "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition",
                  mode === k
                    ? "bg-mauve text-white shadow-sm"
                    : "text-ink/70 hover:bg-white/70 hover:text-ink",
                )}
              >
                <Icon size={16} aria-hidden /> {l}
              </button>
            ))}
          </div>
        )}
        <FormError msg={err} />
        {mode === "phone" ? (
          <AuthInput
            key="phone"
            label="Mobile number"
            icon="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="10-digit mobile number"
            maxLength={16}
            {...register("identifier")}
            error={errors.identifier?.message}
          />
        ) : (
          <AuthInput
            key="email"
            label="Email"
            icon="mail"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            {...register("identifier")}
            error={errors.identifier?.message}
          />
        )}
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
        {mode === "phone" && (
          <p className="text-center text-xs text-stone-500">
            Forgot your password? We’ll email a reset link to the address on
            your account.
          </p>
        )}
      </form>
    </AuthLayout>
  );
}
