import { z } from "zod";

export const password = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(200);
export const email = z.string().trim().toLowerCase().email().max(254);
const token = z.string().min(10).max(200);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password,
  phone: z.string().trim().min(8).max(20),
  salonName: z.string().trim().min(2).max(120),
  stateCode: z
    .string()
    .regex(/^\d{2}$/, "Two-digit GST state code")
    .optional(),
  acceptTerms: z.literal(true, {
    message: "You must accept the Terms and Privacy Policy",
  }),
});
/**
 * Sign in with `identifier` (email or phone, depending on the platform's login setting).
 * `email` is still accepted from older app versions.
 */
export const loginSchema = z
  .object({
    identifier: z.string().trim().min(3).max(254).optional(),
    email: z.string().trim().max(254).optional(),
    password: z.string().min(1).max(200),
    remember: z.boolean().default(true),
  })
  .refine((v) => v.identifier || v.email, {
    message: "Enter your email or phone number",
    path: ["identifier"],
  })
  .transform(({ identifier, email: legacy, ...rest }) => ({
    ...rest,
    identifier: (identifier ?? legacy).toLowerCase(),
  }));
export const tokenSchema = z.object({ token });
export const emailSchema = z.object({ email });
export const resetSchema = z.object({ token, password });
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});
export const acceptInviteSchema = z.object({
  token,
  password,
  acceptTerms: z.literal(true),
});

/** Your own name and mobile number (the mobile is used to sign in when the platform allows it). */
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{7,18}$/, "Enter a valid mobile number")
    .or(z.literal(""))
    .optional(),
});
