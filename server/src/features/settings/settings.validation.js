import { z } from "zod";

// GSTIN: 2-digit state + 10-char PAN + entity + 'Z' + checksum char.
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const hours = z.record(
  z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  z
    .array(
      z
        .tuple([hhmm, hhmm])
        .refine(([a, b]) => a < b, "Opening must be before closing"),
    )
    .max(4),
);

export const profileSchema = z
  .object({
    legalName: z.string().trim().min(2).max(150),
    displayName: z.string().trim().min(2).max(120),
    tagline: z.string().trim().max(150).nullable(),
    gstin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(GSTIN, "Enter a valid 15-character GSTIN")
      .nullable(),
    stateCode: z
      .string()
      .regex(/^\d{2}$/)
      .nullable(),
    pricesIncludeTax: z.boolean(),
    roundOffInvoice: z.boolean(),
    timezone: z.string().refine((tz) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, "Unknown timezone"),
  })
  .partial();

export const branchSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z0-9]{2,5}$/,
      "Code: 2–5 letters/digits (used in invoice numbers)",
    ),
  address: z.string().trim().max(300).nullable().optional(),
  stateCode: z
    .string()
    .regex(/^\d{2}$/)
    .nullable()
    .optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  upiId: z
    .string()
    .trim()
    .regex(/^[\w.-]{2,}@[a-zA-Z]{2,}$/, "Enter a valid UPI ID")
    .nullable()
    .optional(),
  businessHours: hours.nullable().optional(),
  receiptFooter: z.string().trim().max(300).nullable().optional(),
});
/** Branch code is immutable once invoices exist under it. */
export const branchUpdateSchema = branchSchema.omit({ code: true }).partial();

export const resourceSchema = z.object({
  name: z.string().trim().min(1).max(60),
  kind: z.enum(["CHAIR", "ROOM", "STATION"]).default("CHAIR"),
  floor: z.string().trim().min(1).max(40).default("Ground floor"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
export const resourceUpdateSchema = resourceSchema
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const resourceBulkSchema = z.object({
  floor: z.string().trim().min(1).max(40),
  kind: z.enum(["CHAIR", "ROOM", "STATION"]).default("CHAIR"),
  count: z.coerce.number().int().min(1).max(30),
  prefix: z.string().trim().min(1).max(40).default("Chair"),
});
export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});
export const floorRenameSchema = z.object({
  from: z.string().trim().min(1).max(40),
  to: z.string().trim().min(1).max(40),
});
