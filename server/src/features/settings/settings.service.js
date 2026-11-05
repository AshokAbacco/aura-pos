/** Salon profile (GST, receipt branding), branches and chairs/rooms. */
import { prisma, isUniqueViolation } from "../../core/database/prisma.js";
import {
  AppError,
  badRequest,
  conflict,
  notFound,
} from "../../core/errors/errors.js";
import { audit } from "../../core/utils/audit.js";
import { compareChairs } from "../../core/utils/floors.js";

export async function getSettings(ctx) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    include: {
      branches: {
        orderBy: { createdAt: "asc" },
        include: {
          resources: {
            where: { isActive: true },
            orderBy: [{ floor: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
          },
        },
      },
    },
  });
  for (const b of tenant.branches) b.resources.sort(compareChairs);
  const { suspendedReason, ...t } = tenant;
  return t;
}

export async function updateProfile(ctx, data) {
  const current = ctx.tenant;
  const gstin = data.gstin === undefined ? current.gstin : data.gstin;
  const state =
    data.stateCode === undefined ? current.stateCode : data.stateCode;
  if (gstin && state && gstin.slice(0, 2) !== state)
    throw badRequest("GSTIN state code does not match the selected state");
  if (gstin && !state) data.stateCode = gstin.slice(0, 2);
  const t = await prisma.tenant.update({ where: { id: ctx.tenantId }, data });
  await audit(prisma, ctx, "settings.profile", {
    entityType: "Tenant",
    entityId: t.id,
    detail: data,
  });
  return t;
}

export async function createBranch(ctx, data) {
  try {
    const b = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`branch-quota:${ctx.tenantId}`}))`;
      const n = await tx.branch.count({
        where: { tenantId: ctx.tenantId, isActive: true },
      });
      if (n >= ctx.entitlement.limits.maxBranches)
        throw new AppError(
          402,
          "PLAN_LIMIT_BRANCHES",
          `Your plan allows ${ctx.entitlement.limits.maxBranches} branch(es). Upgrade to add more.`,
        );
      return tx.branch.create({ data: { ...data, tenantId: ctx.tenantId } });
    });
    await audit(prisma, ctx, "settings.branch_create", {
      entityType: "Branch",
      entityId: b.id,
    });
    return b;
  } catch (e) {
    if (isUniqueViolation(e))
      throw conflict("DUPLICATE", "Branch code already used");
    throw e;
  }
}

export async function updateBranch(ctx, id, data) {
  const b = await prisma.branch.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!b) throw notFound("Branch");
  const u = await prisma.branch.update({ where: { id: b.id }, data });
  await audit(prisma, ctx, "settings.branch_update", {
    entityType: "Branch",
    entityId: b.id,
    detail: data,
  });
  return u;
}

export async function addResource(ctx, branchId, data) {
  const b = await prisma.branch.findFirst({
    where: { id: branchId, tenantId: ctx.tenantId },
  });
  if (!b) throw notFound("Branch");
  try {
    return await prisma.resource.create({
      data: { ...data, tenantId: ctx.tenantId, branchId: b.id },
    });
  } catch (e) {
    if (isUniqueViolation(e))
      throw conflict("DUPLICATE", "A chair/room with that name exists");
    throw e;
  }
}

/** Rename / move / reorder / deactivate a chair. A chair with an open ticket can't be deactivated. */
export async function updateResource(ctx, id, data) {
  const r = await prisma.resource.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: { ticket: { select: { id: true } } },
  });
  if (!r) throw notFound("Chair");
  if (data.isActive === false && r.ticket)
    throw conflict(
      "CHAIR_BUSY",
      `${r.name} has an open ticket. Bill or clear it first.`,
    );
  try {
    const u = await prisma.resource.update({ where: { id: r.id }, data });
    await audit(prisma, ctx, "settings.resource_update", {
      entityType: "Resource",
      entityId: r.id,
      detail: data,
    });
    return u;
  } catch (e) {
    if (isUniqueViolation(e))
      throw conflict("DUPLICATE", "A chair/room with that name exists");
    throw e;
  }
}
