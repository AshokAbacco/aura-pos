import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export const reasonSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});
export const contactStatusSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "CLOSED", "SPAM"]),
});

export const planSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,40}$/),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  interval: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
  price: z.coerce.number().min(0).max(10000000),
  trialDays: z.coerce.number().int().min(0).max(90).default(0),
  graceDays: z.coerce.number().int().min(0).max(30).default(3),
  maxStaff: z.coerce.number().int().min(1).max(10000),
  maxBranches: z.coerce.number().int().min(1).max(1000),
  features: z
    .array(z.string().regex(/^[a-z_.]+$/))
    .max(50)
    .default([]),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});
export const planUpdateSchema = planSchema.partial().omit({ code: true });
export const extendSchema = z.object({
  days: z.coerce.number().int().min(1).max(366),
  reason: z.string().trim().min(5).max(500),
});
export const changePlanSchema = z.object({
  planId: z.uuid(),
  reason: z.string().trim().min(5).max(500),
});
export const STATES = [
  "TRIAL",
  "ACTIVE",
  "GRACE",
  "EXPIRED",
  "SUSPENDED",
  "NONE",
];

// ── Support desk ──
const optDate = z
  .union([z.iso.datetime({ offset: true }), z.iso.date()])
  .optional()
  .nullable();
export const noteSchema = z.object({
  kind: z.enum(["NOTE", "CALL", "EMAIL", "WHATSAPP", "ISSUE"]).default("NOTE"),
  body: z.string().trim().min(2).max(4000),
  followUpAt: optDate,
});
export const noteUpdateSchema = z.object({
  status: z.enum(["OPEN", "DONE"]).optional(),
  followUpAt: optDate,
  body: z.string().trim().min(2).max(4000).optional(),
});
export const messageSchema = z
  .object({
    audience: z.enum(["selected", "all", "state", "plan", "expiring"]),
    tenantIds: z.array(z.uuid()).max(5000).optional(),
    state: z
      .enum(["TRIAL", "ACTIVE", "GRACE", "EXPIRED", "SUSPENDED", "NONE"])
      .optional(),
    planId: z.uuid().optional(),
    expiresWithin: z.coerce.number().int().min(0).max(365).optional(),
    kind: z.enum(["RENEWAL", "NEW_PLAN", "ANNOUNCEMENT", "CUSTOM"]),
    title: z.string().trim().min(3).max(120),
    body: z.string().trim().min(3).max(2000),
    link: z
      .string()
      .trim()
      .max(300)
      .regex(/^(\/|https:\/\/)/, "Start the link with / or https://")
      .optional()
      .or(z.literal("")),
    email: z.boolean().default(false),
  })
  .refine((v) => v.audience !== "selected" || v.tenantIds?.length, {
    message: "Choose at least one salon",
    path: ["tenantIds"],
  })
  .refine((v) => v.audience !== "state" || v.state, {
    message: "Choose an access state",
    path: ["state"],
  })
  .refine((v) => v.audience !== "plan" || v.planId, {
    message: "Choose a plan",
    path: ["planId"],
  })
  .refine((v) => v.audience !== "expiring" || v.expiresWithin !== undefined, {
    message: "Choose how many days",
    path: ["expiresWithin"],
  });
const adminPassword = z.string().min(12, "At least 12 characters").max(200);
export const adminCreateSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(20).optional(),
  role: z.enum(["SUPER_ADMIN", "SUPPORT"]).default("SUPPORT"),
  password: adminPassword,
});
export const adminUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  role: z.enum(["SUPER_ADMIN", "SUPPORT"]).optional(),
  isActive: z.boolean().optional(),
  password: adminPassword.optional(),
});
export const settingsSchema = z.object({
  loginMethod: z.enum(["EMAIL", "PHONE", "BOTH"]).optional(),
});
