/** Platform Super Admin: tenants, plans, payments, webhooks, contact requests, audit. */
import { prisma } from "../../core/database/prisma.js";
import { audit } from "../../core/utils/audit.js";
import { notFound, unauthorized } from "../../core/errors/errors.js";
import { evaluateEntitlement } from "../subscription/subscription.entitlements.js";
import {
  verifyPassword,
  verifyAgainstDummy,
  revokeAllForPrincipal,
} from "../auth/auth.sessions.js";

export async function checkAdminCredentials({ email, password }, requestId) {
  const admin = await prisma.platformAdmin.findUnique({ where: { email } });
  const valid = admin
    ? await verifyPassword(admin.passwordHash, password)
    : await verifyAgainstDummy(password);
  if (!valid || !admin.isActive)
    throw unauthorized("Incorrect email or password");
  await prisma.platformAdmin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
  await audit(
    prisma,
    { actor: `platform:${admin.id}`, requestId },
    "platform.login",
  );
  return admin;
}

/** Platform overview: salons by access state, money, growth over 12 months, and how much the salons use the product. */
export async function stats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const days30 = new Date(Date.now() - 30 * 86400000);
  const [
    tenants,
    subs,
    captured,
    failedWebhooks,
    newContacts,
    revenueByMonth,
    signupsByMonth,
    usage,
    activeSalons,
    users,
    clients,
  ] = await Promise.all([
    prisma.tenant.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
        subscriptions: {
          orderBy: { currentPeriodEnd: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
    }),
    prisma.subscription.groupBy({ by: ["status"], _count: true }),
    prisma.paymentTransaction.aggregate({
      where: { status: "CAPTURED", createdAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.webhookEvent.count({ where: { status: "FAILED" } }),
    prisma.contactSubmission.count({ where: { status: "NEW" } }),
    prisma.$queryRaw`SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month, SUM("amount")::text AS amount, COUNT(*)::int AS count
      FROM "PaymentTransaction" WHERE "status" = 'CAPTURED' AND "createdAt" >= ${yearAgo} GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw`SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM "Tenant" WHERE "createdAt" >= ${yearAgo} GROUP BY 1 ORDER BY 1`,
    prisma.invoice.aggregate({
      where: {
        kind: "INVOICE",
        status: { not: "VOID" },
        issuedAt: { gte: days30 },
      },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.invoice.groupBy({
      by: ["tenantId"],
      where: { issuedAt: { gte: days30 } },
      _count: true,
    }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.customer.count({ where: { archivedAt: null } }),
  ]);

  const byState = {};
  const byPlan = {};
  let mrr = 0;
  for (const t of tenants) {
    const sub = t.subscriptions[0];
    const e = evaluateEntitlement({
      tenant: t,
      subscription: sub,
      plan: sub?.plan,
      now,
    });
    byState[e.state] = (byState[e.state] ?? 0) + 1;
    if (sub?.plan) byPlan[sub.plan.name] = (byPlan[sub.plan.name] ?? 0) + 1;
    if (e.state === "ACTIVE" && sub?.plan) {
      const months =
        { MONTHLY: 1, QUARTERLY: 3, ANNUAL: 12 }[sub.plan.interval] ?? 1;
      mrr += Number(sub.plan.price) / months;
    }
  }
  // Fill the last 12 months so charts have no gaps.
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const rev = Object.fromEntries(revenueByMonth.map((r) => [r.month, r]));
  const sig = Object.fromEntries(signupsByMonth.map((r) => [r.month, r.count]));

  return {
    tenants: tenants.length,
    suspended: tenants.filter((t) => t.status === "SUSPENDED").length,
    newThisMonth: tenants.filter((t) => t.createdAt >= monthStart).length,
    byState,
    byPlan,
    mrr: mrr.toFixed(2),
    subscriptionsByStatus: Object.fromEntries(
      subs.map((x) => [x.status, x._count]),
    ),
    revenueThisMonth: captured._sum.amount ?? "0",
    paymentsThisMonth: captured._count,
    failedWebhooks,
    newContacts,
    usage: {
      billedLast30Days: usage._sum.grandTotal ?? "0",
      invoicesLast30Days: usage._count,
      salonsBillingLast30Days: activeSalons.length,
      activeUsers: users,
      clients,
    },
    monthly: months.map((m) => ({
      month: m,
      revenue: Number(rev[m]?.amount ?? 0),
      payments: rev[m]?.count ?? 0,
      signups: sig[m] ?? 0,
    })),
  };
}

export async function listTenants({ skip, take, q, state }) {
  const where = q
    ? {
        OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { slug: { contains: q } },
          { users: { some: { email: { contains: q.toLowerCase() } } } },
        ],
      }
    : {};
  const [rows, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip: state ? undefined : skip,
      take: state ? undefined : take,
      orderBy: { createdAt: "desc" },
      include: {
        subscriptions: {
          orderBy: { currentPeriodEnd: "desc" },
          take: 1,
          include: { plan: true },
        },
        users: {
          where: { role: "OWNER" },
          take: 1,
          select: { name: true, email: true, phone: true, lastLoginAt: true },
        },
        _count: {
          select: {
            users: true,
            branches: true,
            customers: true,
            invoices: true,
          },
        },
      },
    }),
    prisma.tenant.count({ where }),
  ]);
  const now = new Date();
  let list = rows.map((t) => {
    const sub = t.subscriptions[0];
    const e = evaluateEntitlement({
      tenant: t,
      subscription: sub,
      plan: sub?.plan,
      now,
    });
    const owner = t.users[0];
    return {
      id: t.id,
      displayName: t.displayName,
      slug: t.slug,
      status: t.status,
      createdAt: t.createdAt,
      owner: owner
        ? {
            name: owner.name,
            email: owner.email,
            phone: owner.phone,
            lastLoginAt: owner.lastLoginAt,
          }
        : null,
      users: t._count.users,
      branches: t._count.branches,
      clients: t._count.customers,
      invoices: t._count.invoices,
      effectiveState: e.state,
      plan: sub?.plan?.name ?? null,
      periodEnd: sub?.currentPeriodEnd ?? null,
    };
  });
  if (state) {
    list = list.filter((t) => t.effectiveState === state);
    return { total: list.length, rows: list.slice(skip, skip + take) };
  }
  return { total, rows: list };
}

/** Everything about one salon: owner and team, branches, plan and its history, payments and usage. */
export async function getTenant(id) {
  const days30 = new Date(Date.now() - 30 * 86400000);
  const [t, billed, billedAll, lastInvoice, lastAudit, counts] =
    await Promise.all([
      prisma.tenant.findUnique({
        where: { id },
        include: {
          branches: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
              phone: true,
              isActive: true,
              _count: { select: { resources: true } },
            },
          },
          users: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
          subscriptions: {
            orderBy: { currentPeriodEnd: "desc" },
            include: {
              plan: true,
              events: { orderBy: { createdAt: "desc" }, take: 30 },
            },
          },
          payments: {
            orderBy: { createdAt: "desc" },
            take: 30,
            include: { plan: { select: { name: true } } },
          },
        },
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId: id,
          kind: "INVOICE",
          status: { not: "VOID" },
          issuedAt: { gte: days30 },
        },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { tenantId: id, kind: "INVOICE", status: { not: "VOID" } },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.invoice.findFirst({
        where: { tenantId: id },
        orderBy: { issuedAt: "desc" },
        select: { issuedAt: true },
      }),
      prisma.auditLog.findFirst({
        where: { tenantId: id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      Promise.all([
        prisma.customer.count({ where: { tenantId: id, archivedAt: null } }),
        prisma.staffProfile.count({ where: { tenantId: id } }),
        prisma.catalogItem.count({ where: { tenantId: id, archivedAt: null } }),
        prisma.appointment.count({
          where: { tenantId: id, startsAt: { gte: days30 } },
        }),
      ]),
    ]);
  if (!t) throw notFound("Tenant");
  const sub = t.subscriptions[0];
  const e = evaluateEntitlement({
    tenant: t,
    subscription: sub,
    plan: sub?.plan,
    now: new Date(),
  });
  const [clients, staff, catalogItems, appointments30] = counts;
  return {
    ...t,
    effectiveState: e.state,
    accessReason: e.reason,
    usage: {
      billedLast30Days: billed._sum.grandTotal ?? "0",
      invoicesLast30Days: billed._count,
      billedAllTime: billedAll._sum.grandTotal ?? "0",
      invoicesAllTime: billedAll._count,
      clients,
      staff,
      catalogItems,
      appointmentsLast30Days: appointments30,
      lastInvoiceAt: lastInvoice?.issuedAt ?? null,
      lastActivityAt: lastAudit?.createdAt ?? null,
    },
  };
}

/**
 * Give a salon extra days on its current plan (goodwill, offline payment, extended trial).
 * Extends from today if the period already ended. Recorded as a subscription event and in the audit log.
 */
export async function extendSubscription(ctx, id, { days, reason }) {
  return prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.findFirst({
      where: { tenantId: id },
      orderBy: { currentPeriodEnd: "desc" },
    });
    if (!sub) throw notFound("Subscription");
    const base =
      sub.currentPeriodEnd > new Date() ? sub.currentPeriodEnd : new Date();
    const end = new Date(base.getTime() + days * 86400000);
    const toStatus =
      sub.status === "TRIAL" && sub.currentPeriodEnd > new Date()
        ? "TRIAL"
        : "ACTIVE";
    const u = await tx.subscription.update({
      where: { id: sub.id },
      data: {
        currentPeriodEnd: end,
        status: toStatus,
        ...(sub.currentPeriodEnd <= new Date()
          ? { currentPeriodStart: new Date() }
          : {}),
      },
    });
    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: sub.id,
        type: "EXTENDED",
        fromStatus: sub.status,
        toStatus,
        actor: ctx.actor,
        detail: { days, reason, from: sub.currentPeriodEnd, to: end },
      },
    });
    await audit(
      tx,
      { tenantId: id, actor: ctx.actor, requestId: ctx.requestId },
      "platform.subscription_extended",
      {
        entityType: "Subscription",
        entityId: sub.id,
        detail: { days, reason },
      },
    );
    return { id: u.id, status: u.status, currentPeriodEnd: u.currentPeriodEnd };
  });
}

/** Move a salon to another plan without a payment (e.g. a Customize deal paid offline). Period dates stay as they are. */
export async function changePlan(ctx, id, { planId, reason }) {
  return prisma.$transaction(async (tx) => {
    const [sub, plan] = await Promise.all([
      tx.subscription.findFirst({
        where: { tenantId: id },
        orderBy: { currentPeriodEnd: "desc" },
        include: { plan: true },
      }),
      tx.subscriptionPlan.findUnique({ where: { id: planId } }),
    ]);
    if (!sub) throw notFound("Subscription");
    if (!plan) throw notFound("Plan");
    const u = await tx.subscription.update({
      where: { id: sub.id },
      data: { planId: plan.id },
    });
    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: sub.id,
        type: "PLAN_CHANGED",
        fromStatus: sub.status,
        toStatus: sub.status,
        actor: ctx.actor,
        detail: { from: sub.plan.name, to: plan.name, reason },
      },
    });
    await audit(
      tx,
      { tenantId: id, actor: ctx.actor, requestId: ctx.requestId },
      "platform.plan_changed",
      {
        entityType: "Subscription",
        entityId: sub.id,
        detail: { from: sub.plan.name, to: plan.name, reason },
      },
    );
    return { id: u.id, plan: plan.name };
  });
}

export async function suspendTenant(ctx, id, reason) {
  const t = await prisma.tenant.update({
    where: { id },
    data: {
      status: "SUSPENDED",
      suspendedReason: reason,
      suspendedAt: new Date(),
    },
  });
  const users = await prisma.user.findMany({
    where: { tenantId: t.id },
    select: { id: true },
  });
  await Promise.all(
    users.map((u) => revokeAllForPrincipal("user", u.id, "TENANT_SUSPENDED")),
  ); // kick out live sessions
  await audit(
    prisma,
    { tenantId: t.id, actor: ctx.actor, requestId: ctx.requestId },
    "platform.tenant_suspended",
    { entityType: "Tenant", entityId: t.id, detail: { reason } },
  );
  return { id: t.id, status: t.status };
}

export async function reactivateTenant(ctx, id, reason) {
  const t = await prisma.tenant.update({
    where: { id },
    data: { status: "ACTIVE", suspendedReason: null, suspendedAt: null },
  });
  await audit(
    prisma,
    { tenantId: t.id, actor: ctx.actor, requestId: ctx.requestId },
    "platform.tenant_reactivated",
    { entityType: "Tenant", entityId: t.id, detail: { reason } },
  );
  return { id: t.id, status: t.status };
}

export const listPlans = () =>
  prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } });

export async function createPlan(ctx, data) {
  const plan = await prisma.subscriptionPlan.create({
    data: { ...data, price: data.price.toFixed(2) },
  });
  await audit(
    prisma,
    { actor: ctx.actor, requestId: ctx.requestId },
    "platform.plan_created",
    { entityType: "SubscriptionPlan", entityId: plan.id, detail: data },
  );
  return plan;
}

export async function updatePlan(ctx, id, data) {
  const plan = await prisma.subscriptionPlan.update({
    where: { id },
    data: {
      ...data,
      ...(data.price !== undefined ? { price: data.price.toFixed(2) } : {}),
    },
  });
  await audit(
    prisma,
    { actor: ctx.actor, requestId: ctx.requestId },
    "platform.plan_updated",
    { entityType: "SubscriptionPlan", entityId: plan.id, detail: data },
  );
  return plan;
}

export async function listPayments({ skip, take }) {
  const [rows, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { select: { displayName: true } },
        plan: { select: { name: true } },
      },
    }),
    prisma.paymentTransaction.count(),
  ]);
  return { rows, total };
}

export const listWebhooks = (status) =>
  prisma.webhookEvent.findMany({
    where: status ? { status } : {},
    orderBy: { receivedAt: "desc" },
    take: 100,
    select: {
      id: true,
      eventId: true,
      eventType: true,
      status: true,
      error: true,
      attempts: true,
      receivedAt: true,
      processedAt: true,
    },
  });
export const listContacts = () =>
  prisma.contactSubmission.findMany({
    where: { status: { not: "SPAM" } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
export const setContactStatus = (id, status) =>
  prisma.contactSubmission.update({ where: { id }, data: { status } });

export async function listAudit({ skip, take, tenantId, action }) {
  const where = {
    ...(tenantId ? { tenantId } : {}),
    ...(action ? { action: { startsWith: action } } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { tenant: { select: { displayName: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { rows, total };
}
