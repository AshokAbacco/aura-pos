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

async function branchOf(ctx, branchId) {
  const b = await prisma.branch.findFirst({
    where: { id: branchId, tenantId: ctx.tenantId },
  });
  if (!b) throw notFound("Branch");
  return b;
}

/**
 * Add one chair. A name that belonged to a removed chair brings that chair back (names are
 * unique per branch, and old bookings still point at the removed one), so "Chair 3" can be re-added.
 */
async function createOrRevive(tx, ctx, branchId, data) {
  const old = await tx.resource.findUnique({
    where: { branchId_name: { branchId, name: data.name } },
  });
  if (old?.isActive) throw conflict("DUPLICATE", `${data.name} already exists`);
  if (old)
    return tx.resource.update({
      where: { id: old.id },
      data: { ...data, isActive: true },
    });
  return tx.resource.create({
    data: { ...data, tenantId: ctx.tenantId, branchId },
  });
}

export async function addResource(ctx, branchId, data) {
  const b = await branchOf(ctx, branchId);
  try {
    const r = await prisma.$transaction((tx) =>
      createOrRevive(tx, ctx, b.id, data),
    );
    await audit(prisma, ctx, "settings.resource_add", {
      entityType: "Resource",
      entityId: r.id,
      detail: data,
    });
    return r;
  } catch (e) {
    if (isUniqueViolation(e))
      throw conflict("DUPLICATE", "A chair/room with that name exists");
    throw e;
  }
}

/** Add several chairs to one floor at once, named "<prefix> N" after the highest number already used in the branch. */
export async function addResourcesBulk(
  ctx,
  branchId,
  { floor, kind, count, prefix },
) {
  const b = await branchOf(ctx, branchId);
  const created = await prisma.$transaction(async (tx) => {
    const all = await tx.resource.findMany({
      where: { branchId: b.id },
      select: { name: true, isActive: true, floor: true },
    });
    const escaped = prefix.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
    const re = new RegExp("^" + escaped + "\\s+(\\d+)$", "i");
    let n = Math.max(
      0,
      ...all
        .filter((r) => r.isActive)
        .map((r) => Number(re.exec(r.name)?.[1] ?? 0)),
    );
    let order = all.filter((r) => r.isActive && r.floor === floor).length;
    const out = [];
    for (let i = 0; i < count; i++) {
      n += 1;
      out.push(
        await createOrRevive(tx, ctx, b.id, {
          name: `${prefix} ${n}`,
          kind,
          floor,
          sortOrder: order++,
        }),
      );
    }
    return out;
  });
  await audit(prisma, ctx, "settings.resource_bulk_add", {
    entityType: "Branch",
    entityId: b.id,
    detail: { floor, kind, count },
  });
  return created;
}

/** Save the order of one floor's chairs in a single transaction (ids in display order). */
export async function reorderResources(ctx, branchId, { ids }) {
  const b = await branchOf(ctx, branchId);
  const found = await prisma.resource.count({
    where: { id: { in: ids }, branchId: b.id, tenantId: ctx.tenantId },
  });
  if (found !== ids.length) throw notFound("Chair");
  await prisma.$transaction(
    ids.map((id, n) =>
      prisma.resource.update({ where: { id }, data: { sortOrder: n } }),
    ),
  );
  return { ids };
}

/** Rename a floor: every active chair on it moves to the new name (merging if that floor exists). */
export async function renameFloor(ctx, branchId, { from, to }) {
  const b = await branchOf(ctx, branchId);
  const r = await prisma.resource.updateMany({
    where: {
      branchId: b.id,
      tenantId: ctx.tenantId,
      floor: from,
      isActive: true,
    },
    data: { floor: to },
  });
  if (!r.count) throw notFound("Floor");
  await audit(prisma, ctx, "settings.floor_rename", {
    entityType: "Branch",
    entityId: b.id,
    detail: { from, to },
  });
  return { from, to, moved: r.count };
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
