/**
 * Floor plan for the billing counter.
 *
 * Every active chair/room of the branch is shown grouped by floor. A chair can hold one open
 * ticket: the services and products the client has had so far. Staff add items to the ticket
 * from the chair screen; billing happens later from the floor plan, and checkout removes the
 * ticket in the same database transaction that creates the invoice (see pos.service.js).
 *
 * Tickets are drafts. Prices shown on the floor plan come from the same pricing engine as
 * checkout, and checkout re-validates and re-prices everything.
 */
import { prisma } from "../../core/database/prisma.js";
import { AppError, notFound, conflict } from "../../core/errors/errors.js";
import { audit } from "../../core/utils/audit.js";
import { buildPricing } from "./pos.service.js";
import { compareChairs } from "../../core/utils/floors.js";

const OPEN_APPOINTMENT = [
  "BOOKED",
  "CONFIRMED",
  "WAITING",
  "CHECKED_IN",
  "IN_SERVICE",
];

async function chairFor(ctx, branchId, resourceId) {
  const chair = await prisma.resource.findFirst({
    where: { id: resourceId, tenantId: ctx.tenantId, branchId, isActive: true },
  });
  if (!chair) throw notFound("Chair");
  return chair;
}

/** Checkout-shaped body from a ticket payload, for pricing. */
function cartBody(ticket) {
  const p = ticket.payload ?? {};
  return {
    customerId: ticket.customerId ?? undefined,
    appointmentId: p.appointmentId ?? undefined,
    lines: (p.lines ?? []).map((l) => ({
      type: l.type,
      itemId: l.itemId,
      quantity: l.quantity,
      staffId: l.staffId || undefined,
      description: l.type === "CUSTOM" ? l.name : undefined,
      unitPrice:
        l.type === "CUSTOM" || String(l.unitPrice) !== String(l.listPrice)
          ? l.unitPrice
          : undefined,
    })),
    offer:
      p.offer === "COUPON"
        ? { kind: "COUPON", couponCode: p.couponCode }
        : { kind: p.offer ?? "NONE" },
    tip: p.tip || 0,
  };
}

/** Running total for a ticket using the real pricing engine; null if it can't be priced yet (e.g. bad coupon). */
async function estimate(ctx, branch, ticket) {
  if (!ticket.payload?.lines?.length) return null;
  try {
    const { priced } = await buildPricing(ctx, cartBody(ticket), prisma, {
      branch,
    });
    return priced.grandTotal.toFixed(2);
  } catch {
    return null;
  }
}

function summarise(ticket, customers, staffById) {
  const lines = ticket.payload?.lines ?? [];
  return {
    id: ticket.id,
    version: ticket.version,
    openedAt: ticket.openedAt,
    updatedAt: ticket.updatedAt,
    customer: ticket.customerId
      ? (customers.get(ticket.customerId) ?? null)
      : null,
    appointmentId: ticket.payload?.appointmentId ?? null,
    itemCount: lines.reduce((a, l) => a + Number(l.quantity || 0), 0),
    items: lines.slice(0, 4).map((l) => l.name),
    stylists: [
      ...new Set(lines.map((l) => staffById.get(l.staffId)).filter(Boolean)),
    ],
  };
}

/** The whole floor plan: chairs by floor, each with its open ticket and its next appointment today. */
export async function floor(ctx, branch) {
  const chairs = await prisma.resource.findMany({
    where: { tenantId: ctx.tenantId, branchId: branch.id, isActive: true },
    orderBy: [{ floor: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { ticket: true },
  });
  chairs.sort(compareChairs);
  const tickets = chairs.map((c) => c.ticket).filter(Boolean);
  const customerIds = [
    ...new Set(tickets.map((t) => t.customerId).filter(Boolean)),
  ];
  const staffIds = [
    ...new Set(
      tickets
        .flatMap((t) => (t.payload?.lines ?? []).map((l) => l.staffId))
        .filter(Boolean),
    ),
  ];
  const now = new Date();
  const dayEnd = new Date(now.getTime() + 24 * 3600000);
  const [customers, staff, appointments] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId: ctx.tenantId, id: { in: customerIds } },
      select: { id: true, name: true, phone: true },
    }),
    prisma.staffProfile.findMany({
      where: { tenantId: ctx.tenantId, id: { in: staffIds } },
      select: { id: true, name: true },
    }),
    prisma.appointment.findMany({
      where: {
        tenantId: ctx.tenantId,
        branchId: branch.id,
        resourceId: { in: chairs.map((c) => c.id) },
        status: { in: OPEN_APPOINTMENT },
        invoiceId: null,
        endsAt: { gte: now },
        startsAt: { lt: dayEnd },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        resourceId: true,
        startsAt: true,
        serviceName: true,
        status: true,
        customer: { select: { name: true } },
        staff: { select: { name: true } },
      },
    }),
  ]);
  const custById = new Map(customers.map((c) => [c.id, c]));
  const staffById = new Map(staff.map((s) => [s.id, s.name]));
  const nextByChair = new Map();
  for (const a of appointments)
    if (!nextByChair.has(a.resourceId)) nextByChair.set(a.resourceId, a);

  const rows = await Promise.all(
    chairs.map(async (c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
      floor: c.floor,
      sortOrder: c.sortOrder,
      ticket: c.ticket
        ? {
            ...summarise(c.ticket, custById, staffById),
            estimate: await estimate(ctx, branch, c.ticket),
          }
        : null,
      nextAppointment: nextByChair.get(c.id) ?? null,
    })),
  );
  return { branchId: branch.id, chairs: rows };
}

/** One chair with its full ticket and today's next booking (for the chair screen and the bill drawer). */
export async function getChair(ctx, branch, resourceId) {
  const chair = await chairFor(ctx, branch.id, resourceId);
  const now = new Date();
  const [ticket, nextAppointment] = await Promise.all([
    prisma.chairTicket.findUnique({ where: { resourceId: chair.id } }),
    prisma.appointment.findFirst({
      where: {
        tenantId: ctx.tenantId,
        resourceId: chair.id,
        status: { in: OPEN_APPOINTMENT },
        invoiceId: null,
        endsAt: { gte: now },
        startsAt: { lt: new Date(now.getTime() + 24 * 3600000) },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        serviceName: true,
        status: true,
        customerId: true,
        customer: { select: { name: true } },
        staff: { select: { name: true } },
      },
    }),
  ]);
  return {
    id: chair.id,
    name: chair.name,
    kind: chair.kind,
    floor: chair.floor,
    ticket,
    nextAppointment,
  };
}

/**
 * Create or replace the chair's ticket. `version` must match the stored one (or be absent when
 * the chair is free) so two counters can't silently overwrite each other. An empty ticket frees the chair.
 */
export async function saveTicket(
  ctx,
  branch,
  resourceId,
  { customerId, payload, version },
) {
  const chair = await chairFor(ctx, branch.id, resourceId);
  if (customerId) {
    const c = await prisma.customer.findFirst({
      where: { id: customerId, tenantId: ctx.tenantId, archivedAt: null },
      select: { id: true },
    });
    if (!c) throw notFound("Client");
  }
  const empty = !payload.lines.length && !customerId;
  return prisma.$transaction(async (tx) => {
    const current = await tx.chairTicket.findUnique({
      where: { resourceId: chair.id },
    });
    if (current && version !== current.version)
      throw new AppError(
        409,
        "TICKET_CHANGED",
        `${chair.name} was updated on another screen. Reload to see the latest.`,
      );
    if (!current && version)
      throw new AppError(
        409,
        "TICKET_CHANGED",
        `${chair.name} was billed or cleared on another screen.`,
      );
    if (empty) {
      if (current) await tx.chairTicket.delete({ where: { id: current.id } });
      return null;
    }
    if (!current) {
      return tx.chairTicket.create({
        data: {
          tenantId: ctx.tenantId,
          branchId: branch.id,
          resourceId: chair.id,
          customerId: customerId ?? null,
          payload,
          openedById: ctx.userId,
        },
      });
    }
    return tx.chairTicket.update({
      where: { id: current.id },
      data: {
        customerId: customerId ?? null,
        payload,
        version: { increment: 1 },
      },
    });
  });
}

/** Free a chair without billing (client left, entered by mistake). Audited when items are discarded. */
export async function clearTicket(ctx, branch, resourceId, reason) {
  const chair = await chairFor(ctx, branch.id, resourceId);
  const current = await prisma.chairTicket.findUnique({
    where: { resourceId: chair.id },
  });
  if (!current) return;
  await prisma.chairTicket.delete({ where: { id: current.id } });
  if (current.payload?.lines?.length) {
    await audit(prisma, ctx, "pos.chair_cleared", {
      entityType: "Resource",
      entityId: chair.id,
      detail: {
        chair: chair.name,
        reason: reason ?? null,
        lines: current.payload.lines.map((l) => ({
          name: l.name,
          quantity: l.quantity,
        })),
      },
    });
  }
}

/** Move the open ticket to a free chair (client changed seat). */
export async function moveTicket(ctx, branch, resourceId, toResourceId) {
  const [from, to] = await Promise.all([
    chairFor(ctx, branch.id, resourceId),
    chairFor(ctx, branch.id, toResourceId),
  ]);
  if (from.id === to.id) return getChair(ctx, branch, to.id);
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.chairTicket.findUnique({
      where: { resourceId: from.id },
    });
    if (!ticket) throw notFound("Open ticket");
    if (await tx.chairTicket.findUnique({ where: { resourceId: to.id } }))
      throw conflict("CHAIR_BUSY", `${to.name} already has an open ticket`);
    return tx.chairTicket.update({
      where: { id: ticket.id },
      data: { resourceId: to.id, version: { increment: 1 } },
    });
  });
}
