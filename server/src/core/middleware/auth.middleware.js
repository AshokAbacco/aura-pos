/**
 * Request context: authentication, tenant scoping, permissions, entitlements.
 *
 * After `authenticate`, handlers receive req.ctx:
 *   { tenantId, userId, actor, role, permissions:Set, branchIds|null(all), entitlement, requestId }
 * tenantId comes ONLY from the verified token + session row — never from body/params/query.
 */
import { prisma } from "../database/prisma.js";
import { AppError, forbidden, unauthorized } from "../errors/errors.js";
import { verifyAccessToken } from "../../features/auth/auth.sessions.js";
import { effectivePermissions } from "../../features/users/users.permissions.js";
import { evaluateEntitlement } from "../../features/subscription/subscription.entitlements.js";

function bearer(req) {
  const h = req.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

export async function loadTenantEntitlement(
  tenantId,
  db = prisma,
  now = new Date(),
) {
  const [tenant, subscription] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId } }),
    db.subscription.findFirst({
      where: { tenantId },
      orderBy: { currentPeriodEnd: "desc" },
      include: { plan: true },
    }),
  ]);
  return {
    tenant,
    subscription,
    entitlement: evaluateEntitlement({
      tenant,
      subscription,
      plan: subscription?.plan,
      now,
    }),
  };
}

export async function authenticate(req, _res, next) {
  const token = bearer(req);
  if (!token) throw unauthorized();
  const claims = verifyAccessToken(token, "user");

  // Everything this request needs is keyed by the verified token, so it is fetched in ONE parallel
  // round trip (session, user, tenant, subscription). With a database in another region this is the
  // difference between ~1 and ~3 network round trips on every API call.
  const [session, user, tenant, subscription] = await Promise.all([
    prisma.session.findUnique({ where: { id: claims.sid } }),
    prisma.user.findUnique({ where: { id: claims.sub } }),
    claims.tid ? prisma.tenant.findUnique({ where: { id: claims.tid } }) : null,
    claims.tid
      ? prisma.subscription.findFirst({
          where: { tenantId: claims.tid },
          orderBy: { currentPeriodEnd: "desc" },
          include: { plan: true },
        })
      : null,
  ]);
  if (
    !session ||
    session.principalType !== "user" ||
    session.principalId !== claims.sub ||
    (session.revokedAt && session.revokeReason !== "ROTATED") ||
    session.expiresAt < new Date()
  ) {
    throw unauthorized("Session revoked");
  }
  // A ROTATED session's access token stays valid until its short expiry; any hard
  // revocation (logout, reuse, disable) re-marks every family member, killing it at once.
  if (!user || !user.isActive || user.tenantId !== claims.tid || !tenant)
    throw unauthorized("Account disabled");

  const entitlement = evaluateEntitlement({
    tenant,
    subscription,
    plan: subscription?.plan,
    now: new Date(),
  });
  req.ctx = {
    requestId: req.id,
    tenantId: user.tenantId,
    userId: user.id,
    actor: `user:${user.id}`,
    role: user.role,
    user,
    tenant,
    subscription,
    permissions: effectivePermissions(user),
    branchIds:
      user.role === "OWNER" || user.allBranches ? null : user.branchIds,
    entitlement,
  };
  next();
}

export async function authenticatePlatform(req, _res, next) {
  const token = bearer(req);
  if (!token) throw unauthorized();
  const claims = verifyAccessToken(token, "platform");
  const [session, admin] = await Promise.all([
    prisma.session.findUnique({ where: { id: claims.sid } }),
    prisma.platformAdmin.findUnique({ where: { id: claims.sub } }),
  ]);
  if (
    !session ||
    session.principalType !== "platform" ||
    (session.revokedAt && session.revokeReason !== "ROTATED") ||
    session.expiresAt < new Date()
  ) {
    throw unauthorized("Session revoked");
  }
  if (!admin || !admin.isActive) throw unauthorized("Account disabled");
  req.ctx = {
    requestId: req.id,
    adminId: admin.id,
    actor: `platform:${admin.id}`,
    admin,
  };
  next();
}

/** Require every listed permission. */
export const requirePermission =
  (...perms) =>
  (req, _res, next) => {
    for (const p of perms)
      if (!req.ctx.permissions.has(p))
        throw forbidden(`Missing permission: ${p}`);
    next();
  };

/** Branch access check for branch-scoped resources. */
export function assertBranchAccess(ctx, branchId) {
  if (ctx.branchIds && !ctx.branchIds.includes(branchId))
    throw forbidden("You do not have access to this branch");
}

/** Reads are allowed in every state except SUSPENDED/CLOSED. */
export function requireReadable(req, _res, next) {
  const e = req.ctx.entitlement;
  if (!e.readable)
    throw new AppError(423, "ACCOUNT_SUSPENDED", e.reason, { state: e.state });
  next();
}

/**
 * Business writes require an entitled subscription, optionally a plan feature.
 * Evaluated from the database on every request, so a long-lived browser session can
 * never keep write access after expiry.
 */
export const requireWritable = (feature) => (req, _res, next) => {
  const e = req.ctx.entitlement;
  if (!e.readable)
    throw new AppError(423, "ACCOUNT_SUSPENDED", e.reason, { state: e.state });
  if (!e.writable)
    throw new AppError(402, "SUBSCRIPTION_INACTIVE", e.reason, {
      state: e.state,
    });
  if (feature && !e.features.has(feature))
    throw new AppError(
      402,
      "PLAN_FEATURE_UNAVAILABLE",
      `Your plan does not include ${feature}`,
      { feature },
    );
  next();
};
