/**
 * Auth service: tenant sign-up, credentials, email verification, password reset, invites, sessions.
 */
import crypto from "node:crypto";
import { prisma, isUniqueViolation } from "../../core/database/prisma.js";
import { getLoginMethod } from "../platform-admin/platform.support.js";
import { env } from "../../config/env.js";
import {
  badRequest,
  conflict,
  unauthorized,
} from "../../core/errors/errors.js";
import { randomToken, sha256 } from "../../core/utils/tokens.js";
import { sendEmail } from "../../core/mail/mailer.js";
import {
  hashPassword,
  verifyPassword,
  verifyAgainstDummy,
  revokeAllForPrincipal,
} from "./auth.sessions.js";
import { audit } from "../../core/utils/audit.js";

const DEFAULT_CATEGORIES = ["Hair", "Skin & Spa", "Nails", "Retail"];

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "salon";

/**
 * Creates tenant + owner + primary branch + default categories, and a trial subscription
 * when the configured trial plan exists, is active and has trialDays > 0. All-or-nothing.
 */
export async function registerTenant({
  name,
  email,
  phone,
  salonName,
  stateCode,
  passwordHash,
}) {
  const trialPlan = await prisma.subscriptionPlan.findUnique({
    where: { code: env.SIGNUP_TRIAL_PLAN_CODE },
  });
  try {
    return await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug: `${slugify(salonName)}-${crypto.randomBytes(3).toString("hex")}`,
          legalName: salonName,
          displayName: salonName,
          stateCode: stateCode ?? null,
        },
      });
      await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: "Main Branch",
          code: "MAIN",
          stateCode: stateCode ?? null,
          phone,
        },
      });
      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((n, i) => ({
          tenantId: tenant.id,
          name: n,
          sortOrder: i,
        })),
      });
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          name,
          phone,
          passwordHash,
          role: "OWNER",
          allBranches: true,
          termsAcceptedAt: new Date(),
        },
      });
      if (trialPlan?.isActive && trialPlan.trialDays > 0) {
        const now = new Date();
        const sub = await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: trialPlan.id,
            status: "TRIAL",
            currentPeriodStart: now,
            currentPeriodEnd: new Date(
              now.getTime() + trialPlan.trialDays * 86400000,
            ),
          },
        });
        await tx.subscriptionEvent.create({
          data: {
            subscriptionId: sub.id,
            type: "CREATED",
            toStatus: "TRIAL",
            actor: `user:${user.id}`,
            detail: { trialDays: trialPlan.trialDays },
          },
        });
      }
      await audit(
        tx,
        { tenantId: tenant.id, actor: `user:${user.id}` },
        "tenant.register",
        { entityType: "Tenant", entityId: tenant.id },
      );
      return { tenant, user };
    });
  } catch (err) {
    if (isUniqueViolation(err))
      throw conflict(
        "EMAIL_TAKEN",
        "An account with this email already exists",
      );
    throw err;
  }
}

// ───────────── Login, verification, password reset, invites ─────────────

async function issueOneTimeToken(purpose, userId, ttlMinutes) {
  const token = randomToken();
  await prisma.oneTimeToken.create({
    data: {
      purpose,
      principalType: "user",
      principalId: userId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + ttlMinutes * 60000),
    },
  });
  return token;
}

/** Atomically consume a one-time token (single use, unexpired). */
async function consumeOneTimeToken(purpose, token) {
  const row = await prisma.oneTimeToken.findUnique({
    where: { tokenHash: sha256(token) },
  });
  if (
    !row ||
    row.purpose !== purpose ||
    row.usedAt ||
    row.expiresAt < new Date()
  )
    throw badRequest("This link is invalid or has expired");
  const { count } = await prisma.oneTimeToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (count !== 1) throw badRequest("This link has already been used");
  return row;
}

export async function sendVerificationEmail(user) {
  const token = await issueOneTimeToken("EMAIL_VERIFY", user.id, 60 * 24);
  await sendEmail({
    to: user.email,
    subject: "Verify your email",
    text: `Confirm your email: ${env.CLIENT_ORIGIN}/verify-email?token=${token}\nThis link expires in 24 hours.`,
  });
}

/** Returns the user on success; throws the same 401 for wrong password and unknown email. */
/**
 * Find the account for a sign-in. The platform admin decides whether salon users sign in with
 * their email, their phone number, or either (Platform admin → Settings → Sign-in method).
 * Phones match on the last 10 digits, so "+91 98765 43210" and "9876543210" are the same.
 */
async function findLoginUsers(identifier) {
  const method = await getLoginMethod();
  const isEmail = identifier.includes("@");
  if (isEmail && method === "PHONE")
    throw unauthorized("Sign in with your mobile number");
  if (!isEmail && method === "EMAIL")
    throw unauthorized("Sign in with your email address");
  if (isEmail) {
    const u = await prisma.user.findUnique({
      where: { email: identifier },
      include: { tenant: true },
    });
    return u ? [u] : [];
  }
  const last10 = identifier.replace(/\D/g, "").slice(-10);
  if (last10.length < 10)
    throw unauthorized("Enter your 10-digit mobile number");
  const ids =
    await prisma.$queryRaw`SELECT id FROM "User" WHERE right(regexp_replace(coalesce(phone, ''), '\\D', '', 'g'), 10) = ${last10}`;
  return ids.length
    ? prisma.user.findMany({
        where: { id: { in: ids.map((r) => r.id) } },
        include: { tenant: true },
      })
    : [];
}

/**
 * Check a sign-in. When one mobile number belongs to several accounts (an owner with two salons,
 * or test sign-ups), the password decides: the one account whose password matches signs in.
 * Only if the same password fits more than one of them do we ask for the email instead.
 */
export async function checkCredentials({ identifier, password }, requestId) {
  const candidates = (await findLoginUsers(identifier)).filter(
    (u) => u.isActive && u.tenant.status !== "CLOSED",
  );
  const matches = [];
  for (const u of candidates)
    if (await verifyPassword(u.passwordHash, password)) matches.push(u);
  if (!candidates.length) await verifyAgainstDummy(password); // same timing whether or not the account exists
  if (matches.length > 1)
    throw unauthorized(
      "This mobile number and password fit more than one account. Sign in with your email.",
    );
  const user = matches[0];
  if (!user) {
    await audit(
      prisma,
      { tenantId: candidates[0]?.tenantId, actor: "anonymous", requestId },
      "auth.login_failed",
      { detail: { idHash: sha256(identifier).slice(0, 16) } },
    );
    throw unauthorized(
      identifier.includes("@")
        ? "Incorrect email or password"
        : "Incorrect mobile number or password",
    );
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  return user;
}

export async function currentUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenant: {
        include: {
          branches: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
}

export async function verifyEmail(token) {
  const row = await consumeOneTimeToken("EMAIL_VERIFY", token);
  await prisma.user.update({
    where: { id: row.principalId },
    data: { emailVerifiedAt: new Date() },
  });
}

export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.isActive) return; // same response either way (no enumeration)
  const token = await issueOneTimeToken("PASSWORD_RESET", user.id, 30);
  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    text: `Reset your password: ${env.CLIENT_ORIGIN}/reset-password?token=${token}\nThis link expires in 30 minutes. If you did not request it, ignore this email.`,
  });
}

export async function resetPassword({ token, password }) {
  const row = await consumeOneTimeToken("PASSWORD_RESET", token);
  await prisma.user.update({
    where: { id: row.principalId },
    data: { passwordHash: await hashPassword(password) },
  });
  await revokeAllForPrincipal("user", row.principalId, "PASSWORD_RESET");
}

export async function changePassword(user, { currentPassword, newPassword }) {
  if (!(await verifyPassword(user.passwordHash, currentPassword)))
    throw unauthorized("Current password is incorrect");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await revokeAllForPrincipal("user", user.id, "PASSWORD_CHANGED");
}

/** Staff invite acceptance: sets the password; possession of the link verifies the email. */
export async function acceptInvite({ token, password }) {
  const row = await consumeOneTimeToken("INVITE", token);
  return prisma.user.update({
    where: { id: row.principalId },
    data: {
      passwordHash: await hashPassword(password),
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
    },
  });
}

export const listSessions = (userId) =>
  prisma.session.findMany({
    where: {
      principalType: "user",
      principalId: userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      familyId: true,
      userAgent: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

export async function revokeSession(userId, sessionId) {
  const s = await prisma.session.findFirst({
    where: { id: sessionId, principalType: "user", principalId: userId },
  });
  if (s)
    await prisma.session.updateMany({
      where: {
        familyId: s.familyId,
        OR: [{ revokedAt: null }, { revokeReason: "ROTATED" }],
      },
      data: { revokedAt: new Date(), revokeReason: "USER_REVOKED" },
    });
}
