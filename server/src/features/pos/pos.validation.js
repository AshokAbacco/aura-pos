/** POS request schemas (zod). Controllers parse with these; services receive clean data. */
import { z } from "zod";

export const money = z
  .union([z.number(), z.string()])
  .pipe(z.coerce.number().min(0).max(10000000));
export const method = z.enum(["CASH", "UPI", "CARD", "WALLET"]);

const line = z
  .object({
    type: z.enum(["SERVICE", "PRODUCT", "MEMBERSHIP", "CUSTOM"]),
    itemId: z.uuid().optional(),
    description: z.string().trim().min(2).max(120).optional(),
    quantity: z.coerce.number().int().min(1).max(999),
    unitPrice: money.optional(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
    staffId: z.uuid().optional().nullable(),
  })
  .refine((l) => l.type === "CUSTOM" || l.itemId, {
    message: "itemId is required",
    path: ["itemId"],
  });

export const cartSchema = z.object({
  branchId: z.uuid().optional(),
  customerId: z.uuid().optional().nullable(),
  appointmentId: z.uuid().optional().nullable(),
  lines: z.array(line).min(1).max(100),
  offer: z
    .object({
      kind: z.enum(["NONE", "MEMBERSHIP", "COUPON"]),
      couponCode: z.string().trim().max(30).optional(),
    })
    .optional(),
  tip: money.optional(),
  payments: z
    .array(
      z.object({
        method,
        amount: money,
        reference: z.string().trim().max(60).optional(),
      }),
    )
    .max(6)
    .optional(),
  allowPartial: z.boolean().optional(),
  chairTicketId: z.uuid().optional(), // billing a chair from the floor plan: the ticket is closed with the invoice
  chairTicketVersion: z.coerce.number().int().min(1).optional(), // refuse if the ticket changed on another screen
});

export const idempotencyKey = z
  .string()
  .regex(/^[\w-]{8,80}$/, "Idempotency-Key header is required (8–80 chars)");

/** A parked cart is an opaque UI draft: it is fully re-validated and re-priced at checkout. */
export const parkSchema = z.object({
  label: z.string().trim().min(1).max(60),
  cart: z
    .record(z.string(), z.unknown())
    .refine((c) => JSON.stringify(c).length <= 20000, "Cart too large"),
});

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{3,20}$/),
    description: z.string().max(200).optional(),
    kind: z.enum(["PERCENT", "FLAT"]),
    value: z.coerce.number().positive().max(1000000),
    minSubtotal: z.coerce.number().min(0).default(0),
    firstVisitOnly: z.boolean().default(false),
    maxUses: z.coerce.number().int().positive().optional().nullable(),
    validFrom: z.coerce.date().optional().nullable(),
    validTo: z.coerce.date().optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .refine((c) => c.kind !== "PERCENT" || c.value <= 100, {
    message: "Percent coupons must be ≤ 100",
    path: ["value"],
  });

/** A chair's open ticket (the floor-plan draft). Re-validated and re-priced at checkout. */
const ticketLine = z.object({
  key: z.string().max(64),
  type: z.enum(["SERVICE", "PRODUCT", "MEMBERSHIP", "CUSTOM"]),
  itemId: z.uuid().optional().nullable(),
  name: z.string().trim().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(999),
  unitPrice: money,
  listPrice: money.optional(),
  staffId: z
    .union([z.uuid(), z.literal("")])
    .optional()
    .nullable(),
  addedAt: z.string().max(40).optional(),
});
export const ticketSchema = z.object({
  customerId: z.uuid().optional().nullable(),
  version: z.coerce.number().int().min(1).optional(),
  payload: z.object({
    lines: z.array(ticketLine).max(100),
    offer: z.enum(["NONE", "MEMBERSHIP", "COUPON"]).default("NONE"),
    couponCode: z.string().trim().max(30).optional().default(""),
    tip: z
      .union([z.literal(""), money])
      .optional()
      .default(""),
    note: z.string().trim().max(300).optional().default(""),
    appointmentId: z.uuid().optional().nullable(), // set when the booked service was pulled into the ticket
  }),
});
export const clearTicketSchema = z.object({
  reason: z.string().trim().max(200).optional(),
});
export const moveTicketSchema = z.object({ toResourceId: z.uuid() });
