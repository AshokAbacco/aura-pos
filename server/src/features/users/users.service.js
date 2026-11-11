/** Team access: invitations, roles, per-user permission overrides, disabling. */
import { prisma, isUniqueViolation } from "../../core/database/prisma.js";
import { env } from "../../config/env.js";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../core/errors/errors.js";
import { audit } from "../../core/utils/audit.js";
import { randomToken, sha256 } from "../../core/utils/tokens.js";
import { sendEmail } from "../../core/mail/mailer.js";
import { effectivePermissions } from "./users.permissions.js";
import { revokeAllForPrincipal } from "../auth/auth.sessions.js";

export const view = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  isActive: u.isActive,
  allBranches: u.allBranches,
  branchIds: u.branchIds,
  permissionGrants: u.permissionGrants,
  permissionRevokes: u.permissionRevokes,
  effectivePermissions: [...effectivePermissions(u)].sort(),
  lastLoginAt: u.lastLoginAt,
  invitePending: !u.passwordHash,
});

export const listUsers = async (ctx) =>
  (
    await prisma.user.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "asc" },
    })
  ).map(view);

async function validBranches(ctx, ids) {
  if (!ids?.length) return;
  const n = await prisma.branch.count({
    where: { tenantId: ctx.tenantId, id: { in: ids } },
  });
  if (n !== new Set(ids).size) throw badRequest("Unknown branch in list");
}

export async function invite(ctx, body) {
  await validBranches(ctx, body.branchIds);
  const token = randomToken();
  try {
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          tenantId: ctx.tenantId,
          name: body.name,
          email: body.email,
          role: body.role,
          branchIds: body.branchIds,
          allBranches: body.allBranches,
        },
      });
      if (body.staffProfileId) {
        const { count } = await tx.staffProfile.updateMany({
          where: {
            id: body.staffProfileId,
            tenantId: ctx.tenantId,
            userId: null,
          },
          data: { userId: u.id },
        });
        if (!count)
          throw badRequest("Staff profile not found or already linked");
      }
      await tx.oneTimeToken.create({
        data: {
          purpose: "INVITE",
          principalType: "user",
          principalId: u.id,
          tokenHash: sha256(token),
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      });
      await audit(tx, ctx, "user.invite", {
        entityType: "User",
        entityId: u.id,
        detail: { role: body.role },
      });
      return u;
    });
    await sendEmail({
      to: user.email,
      subject: `You're invited to ${ctx.tenant.displayName}`,
      text: `${ctx.user.name} invited you to join ${ctx.tenant.displayName} on Salora Glam.\nSet your password: ${env.CLIENT_ORIGIN}/accept-invite?token=${token}\nThis link expires in 7 days.`,
    });
    return view(user);
  } catch (e) {
    if (isUniqueViolation(e))
      throw conflict("EMAIL_TAKEN", "A user with this email already exists");
    throw e;
  }
}

export async function updateAccess(ctx, id, body) {
  const u = await prisma.user.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!u) throw notFound("User");
  if (u.role === "OWNER")
    throw forbidden("The owner account cannot be modified here");
  if (u.id === ctx.userId) throw forbidden("You cannot change your own access");
  await validBranches(ctx, body.branchIds);
  const updated = await prisma.user.update({ where: { id: u.id }, data: body });
  if (body.isActive === false || body.role || body.permissionRevokes)
    await revokeAllForPrincipal("user", u.id, "ACCESS_CHANGED");
  await audit(prisma, ctx, "user.access_change", {
    entityType: "User",
    entityId: u.id,
    detail: body,
  });
  return view(updated);
}
