import { z } from "zod";
import { PERMISSIONS } from "./users.permissions.js";

export const ASSIGNABLE_ROLES = [
  "MANAGER",
  "RECEPTIONIST",
  "STYLIST",
  "INVENTORY_MANAGER",
  "ACCOUNTANT",
]; // OWNER is never assignable
const perm = z.enum(PERMISSIONS);

export const inviteSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(ASSIGNABLE_ROLES),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{7,18}$/, "Enter a valid mobile number")
    .optional()
    .or(z.literal("")), // needed when salon users sign in by mobile
  branchIds: z.array(z.uuid()).default([]),
  allBranches: z.boolean().default(false),
  staffProfileId: z.uuid().optional(),
});
export const accessSchema = z
  .object({
    role: z.enum(ASSIGNABLE_ROLES),
    branchIds: z.array(z.uuid()),
    allBranches: z.boolean(),
    permissionGrants: z.array(perm),
    permissionRevokes: z.array(perm),
    isActive: z.boolean(),
    phone: z
      .string()
      .trim()
      .regex(/^[+\d][\d\s-]{7,18}$/, "Enter a valid mobile number")
      .or(z.literal("")),
  })
  .partial();
