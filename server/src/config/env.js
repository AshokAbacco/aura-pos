/**
 * Validated configuration. The process refuses to start with missing/invalid settings,
 * and production refuses development-grade secrets.
 */
import "dotenv/config";
import { z } from "zod";

const bool = z.enum(["true", "false"]).transform((v) => v === "true");

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"), // React app origin (CORS allow-list, links in emails)
  // More origins allowed to call the API, comma separated. The Android app (Capacitor) is https://localhost.
  EXTRA_CORS_ORIGINS: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    ),
  API_PUBLIC_URL: z.string().url().default("http://localhost:4000"),
  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  // The Android/iOS app stays signed in until the user signs out, as long as it is opened at least once
  // in this many days (the expiry slides forward on every refresh).
  REFRESH_TOKEN_TTL_DAYS_NATIVE: z.coerce
    .number()
    .int()
    .positive()
    .default(365),
  // 'strict' when the website and API share a site (recommended: same domain or one Render service).
  // 'none' only if the website and API are on different sites (e.g. two *.onrender.com services).
  // auto: Strict when the website and API share an address, None (+Secure) when the website calls the
  // API on another address (e.g. two *.onrender.com services), so refreshing the page keeps you signed in.
  COOKIE_SAMESITE: z.enum(["auto", "strict", "lax", "none"]).default("auto"),
  COOKIE_SECURE: bool.default("false"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),
  RAZORPAY_API_BASE: z.string().url().default("https://api.razorpay.com/v1"),
  SIGNUP_TRIAL_PLAN_CODE: z.string().default("trial"),
  RUN_JOBS: bool.default("false"), // true → run scheduled jobs (reminders, low-stock alerts) inside this process
  SERVE_CLIENT: bool.default("false"), // true → this process also serves client/dist (one-port production)
  // Optional self-ping so a free host that sleeps when idle (e.g. Render free) stays awake.
  // Set to this service's own public health URL, e.g. https://aura-pos-api.onrender.com/health. Empty = off.
  KEEP_ALIVE_URL: z.union([z.literal(""), z.string().url()]).default(""),
  KEEP_ALIVE_INTERVAL_MIN: z.coerce.number().int().min(1).max(14).default(10), // Render free sleeps after 15 idle minutes
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  EMAIL_FROM: z.string().default("Salora Glam <no-reply@example.com>"),
  SMTP_URL: z.string().default(""), // empty → emails are logged, not sent (development only)
});

function load() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = parsed.data;
  if (env.NODE_ENV === "production") {
    const problems = [];
    if (!env.COOKIE_SECURE) problems.push("COOKIE_SECURE must be true");
    if (env.COOKIE_SAMESITE === "none" && !env.COOKIE_SECURE)
      problems.push("COOKIE_SAMESITE=none requires COOKIE_SECURE=true");
    if (/change-me|dev|test/i.test(env.JWT_ACCESS_SECRET))
      problems.push("JWT_ACCESS_SECRET looks like a development value");
    for (const k of [
      "RAZORPAY_KEY_ID",
      "RAZORPAY_KEY_SECRET",
      "RAZORPAY_WEBHOOK_SECRET",
      "SMTP_URL",
    ])
      if (!env[k]) problems.push(`${k} is required in production`);
    if (!env.CLIENT_ORIGIN.startsWith("https://"))
      problems.push("CLIENT_ORIGIN must be https in production");
    if (problems.length)
      throw new Error(
        `Refusing to start in production:\n  ${problems.join("\n  ")}`,
      );
  }
  return Object.freeze(env);
}

export const env = load();
export const isTest = env.NODE_ENV === "test";
export const isProd = env.NODE_ENV === "production";
