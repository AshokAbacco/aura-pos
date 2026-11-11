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
