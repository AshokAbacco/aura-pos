/**
 * Platform admin for the support team: find anything, see a salon and each of its people in full,
 * keep notes and follow-ups, message salons (renewal reminders, new plans, announcements),
 * manage the platform team, and platform settings (how salon users sign in).
 */
import { randomUUID } from "node:crypto";
import { prisma } from "../../core/database/prisma.js";
import { audit } from "../../core/utils/audit.js";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../core/errors/errors.js";
import { evaluateEntitlement } from "../subscription/subscription.entitlements.js";
import { hashPassword, revokeAllForPrincipal } from "../auth/auth.sessions.js";
import { sendEmail } from "../../core/mail/mailer.js";
import { env } from "../../config/env.js";
import { logger } from "../../core/logger/logger.js";

const DAY = 86400000;
const like = (q) => ({ contains: q, mode: "insensitive" });
const digits = (s) => String(s ?? "").replace(/\D/g, "");

/**
 * Ids of rows whose phone contains these digits, ignoring spaces, dashes and +91
 * ("98450 12345" finds "+91 98450-12345"). Table names are fixed strings, never user input.
 */
async function idsByPhone(table, d) {
  if (d.length < 4) return [];
  const needle = d.length > 10 ? d.slice(-10) : d;
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id FROM "${table}" WHERE regexp_replace(coalesce(phone, ''), '\\D', '', 'g') LIKE '%' || $1 || '%' LIMIT 500`,
    needle,
  );
  return rows.map((r) => r.id);
}

// ───────────────────────────── Universal search ─────────────────────────────

/**
 * One box, everything: salons, salon logins (owners and staff), salon customers, invoices and
 * subscription payments. Phone numbers match on their digits ("98765 43210" finds "+919876543210").
 */
export async function search(q) {
  q = String(q ?? "").trim();
  if (q.length < 2)
    return {
      tenants: [],
      users: [],
      customers: [],
      invoices: [],
      payments: [],
    };
  const d = digits(q);
  const [userIds, customerIds, branchIds] = await Promise.all([
    idsByPhone("User", d),
    idsByPhone("Customer", d),
    idsByPhone("Branch", d),
  ]);
  const byPhone = (ids) => (ids.length ? [{ id: { in: ids } }] : []);
  const tenantSel = { select: { id: true, displayName: true } };
  const [tenants, users, customers, invoices, payments] = await Promise.all([
    prisma.tenant.findMany({
      where: {
        OR: [
          { displayName: like(q) },
          { legalName: like(q) },
          { slug: like(q) },
          { gstin: like(q) },
          {
            branches: {
              some: {
                OR: [
                  { name: like(q) },
                  { address: like(q) },
                  ...byPhone(branchIds),
                ],
              },
            },
          },
        ],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        subscriptions: {
          orderBy: { currentPeriodEnd: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [{ name: like(q) }, { email: like(q) }, ...byPhone(userIds)],
      },
      take: 10,
      include: { tenant: tenantSel },
    }),
    prisma.customer.findMany({
      where: {
        archivedAt: null,
        OR: [{ name: like(q) }, { email: like(q) }, ...byPhone(customerIds)],
      },
      take: 10,
      include: { tenant: tenantSel },
    }),
    prisma.invoice.findMany({
      where: { number: like(q) },
      take: 8,
      orderBy: { issuedAt: "desc" },
      include: { tenant: tenantSel },
    }),
    prisma.paymentTransaction.findMany({
      where: {
        OR: [{ providerOrderId: like(q) }, { providerPaymentId: like(q) }],
      },
      take: 8,
      include: { tenant: tenantSel, plan: { select: { name: true } } },
    }),
  ]);
  const now = new Date();
  return {
    tenants: tenants.map((t) => {
      const s = t.subscriptions[0];
      return {
        id: t.id,
        displayName: t.displayName,
        slug: t.slug,
        plan: s?.plan.name ?? null,
        state: evaluateEntitlement({
          tenant: t,
          subscription: s,
          plan: s?.plan,
          now,
        }).state,
      };
    }),
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      tenant: u.tenant,
    })),
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      tenant: c.tenant,
    })),
    invoices: invoices.map((i) => ({
      id: i.id,
      number: i.number,
      grandTotal: i.grandTotal,
      status: i.status,
      issuedAt: i.issuedAt,
      tenant: i.tenant,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      providerOrderId: p.providerOrderId,
      providerPaymentId: p.providerPaymentId,
      plan: p.plan?.name,
      createdAt: p.createdAt,
      tenant: p.tenant,
    })),
  };
}

// ───────────────────────────── Salons list with filters ─────────────────────────────

const SORTS = {
  newest: (a, b) => b.createdAt - a.createdAt,
  oldest: (a, b) => a.createdAt - b.createdAt,
  name: (a, b) => a.displayName.localeCompare(b.displayName),
  expiry: (a, b) =>
    (a.periodEnd?.getTime() ?? Infinity) - (b.periodEnd?.getTime() ?? Infinity),
  active: (a, b) =>
    (b.lastActivityAt?.getTime() ?? 0) - (a.lastActivityAt?.getTime() ?? 0),
  revenue: (a, b) => Number(b.billed30) - Number(a.billed30),
};

/**
 * All salons with owner, plan, access state, usage, last activity and open follow-ups.
 * Filters: q (name / slug / GSTIN / owner email or phone), state, planId, expiresWithin (days),
 * joinedFrom / joinedTo, followUp (due = has an open follow-up due today or earlier). Sort: see SORTS.
 */
export async function listSalons({
  q,
  state,
  planId,
  expiresWithin,
  joinedFrom,
  joinedTo,
  followUp,
  sort = "newest",
  skip = 0,
  take = 50,
}) {
  const and = [];
  if (q) {
    const userIds = await idsByPhone("User", digits(q));
    and.push({
      OR: [
        { displayName: like(q) },
        { legalName: like(q) },
        { slug: like(q) },
        { gstin: like(q) },
        {
          users: {
            some: {
              OR: [
                { email: like(q) },
                { name: like(q) },
                ...(userIds.length ? [{ id: { in: userIds } }] : []),
              ],
            },
          },
        },
      ],
    });
  }
  if (joinedFrom) and.push({ createdAt: { gte: new Date(joinedFrom) } });
  if (joinedTo)
    and.push({
      createdAt: { lte: new Date(new Date(joinedTo).getTime() + DAY - 1) },
    });
  const now = new Date();
  if (followUp === "due")
    and.push({
      supportNotes: {
        some: {
          status: "OPEN",
          followUpAt: { lte: new Date(now.getTime() + DAY) },
        },
      },
    });
  if (followUp === "open")
    and.push({
      supportNotes: { some: { status: "OPEN", followUpAt: { not: null } } },
    });

  const rows = await prisma.tenant.findMany({
    where: and.length ? { AND: and } : {},
    include: {
      subscriptions: {
        orderBy: { currentPeriodEnd: "desc" },
        take: 1,
        include: { plan: true },
      },
      users: {
        where: { role: "OWNER" },
        take: 1,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          lastLoginAt: true,
        },
      },
      _count: {
        select: {
          users: true,
          branches: true,
          customers: true,
          invoices: true,
          supportNotes: {
            where: { status: "OPEN", followUpAt: { not: null } },
          },
        },
      },
    },
  });
  const ids = rows.map((t) => t.id);
  const since30 = new Date(now.getTime() - 30 * DAY);
  const [lastSeen, billed] = await Promise.all([
    ids.length
      ? prisma.auditLog.groupBy({
          by: ["tenantId"],
          where: { tenantId: { in: ids } },
          _max: { createdAt: true },
        })
      : [],
    ids.length
      ? prisma.invoice.groupBy({
          by: ["tenantId"],
          where: {
            tenantId: { in: ids },
            kind: "INVOICE",
            status: { not: "VOID" },
            issuedAt: { gte: since30 },
          },
          _sum: { grandTotal: true },
        })
      : [],
  ]);
  const seen = new Map(lastSeen.map((r) => [r.tenantId, r._max.createdAt]));
  const billedBy = new Map(billed.map((r) => [r.tenantId, r._sum.grandTotal]));

  let list = rows.map((t) => {
    const sub = t.subscriptions[0];
    const e = evaluateEntitlement({
      tenant: t,
      subscription: sub,
      plan: sub?.plan,
      now,
    });
    const end = sub?.currentPeriodEnd ?? null;
    return {
      id: t.id,
      displayName: t.displayName,
      slug: t.slug,
      status: t.status,
      createdAt: t.createdAt,
      owner: t.users[0] ?? null,
      users: t._count.users,
      branches: t._count.branches,
      clients: t._count.customers,
      invoices: t._count.invoices,
      openFollowUps: t._count.supportNotes,
      effectiveState: e.state,
      plan: sub?.plan?.name ?? null,
      planId: sub?.planId ?? null,
      subscriptionStatus: sub?.status ?? null,
      periodEnd: end,
      daysLeft: end ? Math.ceil((end.getTime() - now.getTime()) / DAY) : null,
      lastActivityAt: seen.get(t.id) ?? t.users[0]?.lastLoginAt ?? null,
      billed30: billedBy.get(t.id)?.toString() ?? "0",
    };
  });
  if (state) list = list.filter((t) => t.effectiveState === state);
  if (planId) list = list.filter((t) => t.planId === planId);
  if (expiresWithin)
    list = list.filter(
      (t) =>
        t.daysLeft !== null && t.daysLeft >= 0 && t.daysLeft <= expiresWithin,
    );
  list.sort(SORTS[sort] ?? SORTS.newest);
  return { total: list.length, rows: list.slice(skip, skip + take) };
}

// ───────────────────────────── Salon activity and people ─────────────────────────────

/** A salon's audit log (who did what), optionally only one person's actions. */
export async function salonActivity(tenantId, { skip, take, userId, action }) {
  const where = {
    tenantId,
    ...(userId ? { actor: `user:${userId}` } : {}),
    ...(action ? { action: { startsWith: action } } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.auditLog.count({ where }),
  ]);
  const userIds = [
    ...new Set(
      rows
        .map((r) => r.actor.startsWith("user:") && r.actor.slice(5))
        .filter(Boolean),
    ),
  ];
  const people = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      })
    : [];
  const names = new Map(people.map((p) => [`user:${p.id}`, p.name]));
  return {
    total,
    rows: rows.map((r) => ({
      ...r,
      actorName:
        names.get(r.actor) ??
        (r.actor.startsWith("platform:") ? "Platform team" : r.actor),
    })),
  };
}

/** Everything about one person in a salon: login, role, access, staff record, devices, recent actions, sales. */
export async function salonUser(tenantId, userId) {
  const u = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    include: { staffProfile: true },
  });
  if (!u) throw notFound("User");
  const since30 = new Date(Date.now() - 30 * DAY);
  const [sessions, recent, actions30, sales, branches] = await Promise.all([
    prisma.session.findMany({
      where: {
        principalType: "user",
        principalId: u.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: "desc" },
      take: 10,
      select: {
        id: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: { tenantId, actor: `user:${u.id}` },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.auditLog.count({
      where: { tenantId, actor: `user:${u.id}`, createdAt: { gte: since30 } },
    }),
    prisma.invoice.aggregate({
      where: {
        tenantId,
        cashierUserId: u.id,
        kind: "INVOICE",
        status: { not: "VOID" },
        issuedAt: { gte: since30 },
      },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.branch.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    }),
  ]);
  const { passwordHash, ...safe } = u; // never send the hash
  return {
    ...safe,
    hasPassword: !!passwordHash,
    branchNames: u.allBranches
      ? ["All branches"]
      : branches.filter((b) => u.branchIds.includes(b.id)).map((b) => b.name),
    sessions,
    recent,
    actionsLast30Days: actions30,
    billedLast30Days: sales._sum.grandTotal ?? "0",
    billsLast30Days: sales._count,
  };
}

/** Sign a salon user out of every device (lost phone, staff left, suspicious activity). */
export async function signOutSalonUser(ctx, tenantId, userId, reason) {
  const u = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  if (!u) throw notFound("User");
  await revokeAllForPrincipal("user", u.id, "PLATFORM_SIGN_OUT");
  await audit(prisma, { ...ctx, tenantId }, "platform.user_signed_out", {
    entityType: "User",
    entityId: u.id,
    detail: { reason },
  });
  return { ok: true };
}

// ───────────────────────────── Notes and follow-ups ─────────────────────────────

const noteInclude = {
  author: { select: { id: true, name: true } },
  tenant: { select: { id: true, displayName: true } },
};

export async function listNotes(tenantId) {
  return prisma.tenantNote.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: noteInclude,
  });
}

export async function addNote(ctx, tenantId, { kind, body, followUpAt }) {
  if (
    !(await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    }))
  )
    throw notFound("Tenant");
  const n = await prisma.tenantNote.create({
    data: {
      tenantId,
      authorId: ctx.adminId,
      kind,
      body,
      followUpAt: followUpAt ? new Date(followUpAt) : null,
    },
    include: noteInclude,
  });
  await audit(prisma, { ...ctx, tenantId }, "platform.note_added", {
    entityType: "TenantNote",
    entityId: n.id,
    detail: { kind, followUpAt },
  });
  return n;
}

export async function updateNote(ctx, id, { status, followUpAt, body }) {
  const n = await prisma.tenantNote.findUnique({ where: { id } });
  if (!n) throw notFound("Note");
  const data = {};
  if (status) {
    data.status = status;
    data.doneAt = status === "DONE" ? new Date() : null;
  }
  if (followUpAt !== undefined) {
    data.followUpAt = followUpAt ? new Date(followUpAt) : null;
    if (followUpAt) {
      data.status = "OPEN";
      data.doneAt = null;
    }
  }
  if (body) data.body = body;
  return prisma.tenantNote.update({
    where: { id },
    data,
    include: noteInclude,
  });
}

/**
 * The renewals desk: salons whose plan ends soon, those in grace or recently expired, trials ending,
 * and every open follow-up (overdue first).
 */
export async function followUps({ days = 14 } = {}) {
  const now = new Date();
  const horizon = new Date(now.getTime() + days * DAY);
  const recent = new Date(now.getTime() - 60 * DAY);
  const [subs, notes] = await Promise.all([
    prisma.subscription.findMany({
      where: { currentPeriodEnd: { gte: recent, lte: horizon } },
      orderBy: { currentPeriodEnd: "asc" },
      include: {
        plan: true,
        tenant: {
          include: {
            users: {
              where: { role: "OWNER" },
              take: 1,
              select: { name: true, email: true, phone: true },
            },
            subscriptions: {
              orderBy: { currentPeriodEnd: "desc" },
              take: 1,
              select: { id: true },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { createdAt: true, kind: true },
            },
            supportNotes: {
              where: { status: "OPEN", followUpAt: { not: null } },
              orderBy: { followUpAt: "asc" },
              take: 1,
              select: { followUpAt: true, body: true },
            },
          },
        },
      },
    }),
    prisma.tenantNote.findMany({
      where: { status: "OPEN", followUpAt: { not: null } },
      orderBy: { followUpAt: "asc" },
      take: 200,
      include: noteInclude,
    }),
  ]);
  const rows = subs
    .filter((s) => s.tenant.subscriptions[0]?.id === s.id) // only each salon's latest subscription
    .map((s) => {
      const e = evaluateEntitlement({
        tenant: s.tenant,
        subscription: s,
        plan: s.plan,
        now,
      });
      const daysLeft = Math.ceil(
        (s.currentPeriodEnd.getTime() - now.getTime()) / DAY,
      );
      return {
        tenantId: s.tenantId,
        displayName: s.tenant.displayName,
        owner: s.tenant.users[0] ?? null,
        plan: s.plan.name,
        status: s.status,
        state: e.state,
        periodEnd: s.currentPeriodEnd,
        daysLeft,
        bucket:
          s.status === "TRIAL" && daysLeft >= 0
            ? "trial"
            : daysLeft >= 0
              ? "expiring"
              : e.state === "GRACE"
                ? "grace"
                : "expired",
        lastMessage: s.tenant.messages[0] ?? null,
        nextFollowUp: s.tenant.supportNotes[0] ?? null,
      };
    });
  return {
    expiring: rows.filter((r) => r.bucket === "expiring"),
    trial: rows.filter((r) => r.bucket === "trial"),
    grace: rows.filter((r) => r.bucket === "grace"),
    expired: rows.filter((r) => r.bucket === "expired").reverse(),
    followUps: notes.map((n) => ({ ...n, overdue: n.followUpAt < now })),
  };
}

// ───────────────────────────── Messages to salons ─────────────────────────────

/**
 * Send a message to salons, shown in their app's bell; with `email`, also emailed to each owner.
 * Audience: specific salons (tenantIds) or a segment (all / by access state / by plan / expiring within N days).
 */
export async function sendMessage(
  ctx,
  {
    audience,
    tenantIds,
    state,
    planId,
    expiresWithin,
    kind,
    title,
    body,
    link,
    email,
  },
) {
  let targets;
  if (audience === "selected") {
    targets = await prisma.tenant.findMany({
      where: { id: { in: tenantIds ?? [] } },
      select: { id: true },
    });
  } else {
    const { rows } = await listSalons({
      state: audience === "state" ? state : undefined,
      planId: audience === "plan" ? planId : undefined,
      expiresWithin: audience === "expiring" ? expiresWithin : undefined,
      take: 100000,
    });
    targets = rows.filter((t) => t.status !== "CLOSED");
  }
  if (!targets.length) throw badRequest("No salons match this audience");
  const batchId = randomUUID();
  await prisma.tenantMessage.createMany({
    data: targets.map((t) => ({
      tenantId: t.id,
      kind,
      title,
      body,
      link: link || null,
      createdById: ctx.adminId,
      batchId,
    })),
  });

  let emailed = 0;
  if (email) {
    const owners = await prisma.user.findMany({
      where: {
        tenantId: { in: targets.map((t) => t.id) },
        role: "OWNER",
        isActive: true,
      },
      select: { tenantId: true, email: true, name: true },
    });
    for (const o of owners) {
      try {
        await sendEmail({
          to: o.email,
          subject: title,
          text: `Hello ${o.name},\n\n${body}\n\n${link ? `${link.startsWith("http") ? link : env.CLIENT_ORIGIN + link}\n\n` : ""}— The Salora Glam team`,
        });
        await prisma.tenantMessage.updateMany({
          where: { batchId, tenantId: o.tenantId },
          data: { emailedTo: o.email },
        });
        emailed += 1;
      } catch (e) {
        logger.warn({ err: e, to: o.email }, "message email failed");
      }
    }
  }
  await audit(prisma, ctx, "platform.message_sent", {
    entityType: "TenantMessage",
    entityId: batchId,
    detail: { kind, title, audience, recipients: targets.length, emailed },
  });
  return { batchId, recipients: targets.length, emailed };
}

/** Sent messages, one row per send (batch), newest first. */
export async function listMessageBatches({ skip, take, tenantId }) {
  const where = tenantId ? { tenantId } : {};
  const groups = await prisma.tenantMessage.groupBy({
    by: ["batchId"],
    where,
    _count: true,
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: "desc" } },
    skip,
    take,
  });
  const ids = groups.map((g) => g.batchId).filter(Boolean);
  const firsts = ids.length
    ? await prisma.tenantMessage.findMany({
        where: { batchId: { in: ids } },
        distinct: ["batchId"],
        include: {
          createdBy: { select: { name: true } },
          tenant: { select: { displayName: true } },
        },
      })
    : [];
  const reads = ids.length
    ? await prisma.tenantMessage.groupBy({
        by: ["batchId"],
        where: { batchId: { in: ids }, readAt: { not: null } },
        _count: true,
      })
    : [];
  const emailedC = ids.length
    ? await prisma.tenantMessage.groupBy({
        by: ["batchId"],
        where: { batchId: { in: ids }, emailedTo: { not: null } },
        _count: true,
      })
    : [];
  const f = new Map(firsts.map((m) => [m.batchId, m]));
  const r = new Map(reads.map((x) => [x.batchId, x._count]));
  const em = new Map(emailedC.map((x) => [x.batchId, x._count]));
  return groups
    .filter((g) => g.batchId)
    .map((g) => {
      const m = f.get(g.batchId);
      return {
        batchId: g.batchId,
        kind: m?.kind,
        title: m?.title,
        body: m?.body,
        link: m?.link,
        sentAt: g._max.createdAt,
        by: m?.createdBy?.name ?? "—",
        recipients: g._count,
        read: r.get(g.batchId) ?? 0,
        emailed: em.get(g.batchId) ?? 0,
        firstSalon: g._count === 1 ? m?.tenant.displayName : null,
      };
    });
}

// Salon side: the bell in the app.
export async function inbox(tenantId) {
  const [rows, unread] = await Promise.all([
    prisma.tenantMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        kind: true,
        title: true,
        body: true,
        link: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.tenantMessage.count({ where: { tenantId, readAt: null } }),
  ]);
  return { rows, unread };
}
export async function markRead(tenantId, id) {
  await prisma.tenantMessage.updateMany({
    where: { tenantId, readAt: null, ...(id === "all" ? {} : { id }) },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

// ───────────────────────────── Platform team ─────────────────────────────

const adminSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
};

export const listAdmins = () =>
  prisma.platformAdmin.findMany({
    orderBy: { createdAt: "asc" },
    select: adminSelect,
  });

export async function createAdmin(ctx, { email, name, phone, role, password }) {
  if (await prisma.platformAdmin.findUnique({ where: { email } }))
    throw conflict("DUPLICATE", "That email is already on the platform team");
  const a = await prisma.platformAdmin.create({
    data: {
      email,
      name,
      phone: phone || null,
      role,
      passwordHash: await hashPassword(password),
    },
    select: adminSelect,
  });
  await audit(prisma, ctx, "platform.admin_created", {
    entityType: "PlatformAdmin",
    entityId: a.id,
    detail: { email, role },
  });
  return a;
}

export async function updateAdmin(
  ctx,
  id,
  { name, phone, role, isActive, password },
) {
  const a = await prisma.platformAdmin.findUnique({ where: { id } });
  if (!a) throw notFound("Admin");
  const losingSuper =
    a.role === "SUPER_ADMIN" &&
    a.isActive &&
    (role === "SUPPORT" || isActive === false);
  if (
    losingSuper &&
    (await prisma.platformAdmin.count({
      where: { role: "SUPER_ADMIN", isActive: true },
    })) <= 1
  ) {
    throw forbidden("Keep at least one active super admin");
  }
  const data = {
    ...(name ? { name } : {}),
    ...(phone !== undefined ? { phone: phone || null } : {}),
    ...(role ? { role } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };
  if (password) data.passwordHash = await hashPassword(password);
  const out = await prisma.platformAdmin.update({
    where: { id },
    data,
    select: adminSelect,
  });
  if (password || isActive === false || role)
    await revokeAllForPrincipal("platform", id, "ADMIN_CHANGED");
  await audit(prisma, ctx, "platform.admin_updated", {
    entityType: "PlatformAdmin",
    entityId: id,
    detail: { role, isActive, passwordReset: !!password },
  });
  return out;
}

// ───────────────────────────── Platform settings ─────────────────────────────

export const LOGIN_METHODS = ["EMAIL", "PHONE", "BOTH"];
const DEFAULTS = { loginMethod: "EMAIL" };

export async function getSettings() {
  const rows = await prisma.platformSetting.findMany();
  return {
    ...DEFAULTS,
    ...Object.fromEntries(rows.map((r) => [r.key, r.value])),
  };
}

/** Cached for a few seconds: read on every sign-in and by the public login page. */
let cache = null;
export async function getLoginMethod() {
  if (cache && cache.until > Date.now()) return cache.value;
  const row = await prisma.platformSetting.findUnique({
    where: { key: "loginMethod" },
  });
  const value = LOGIN_METHODS.includes(row?.value)
    ? row.value
    : DEFAULTS.loginMethod;
  cache = { value, until: Date.now() + 10_000 };
  return value;
}

export async function updateSettings(ctx, { loginMethod }) {
  if (loginMethod) {
    await prisma.platformSetting.upsert({
      where: { key: "loginMethod" },
      update: { value: loginMethod, updatedBy: ctx.adminId },
      create: {
        key: "loginMethod",
        value: loginMethod,
        updatedBy: ctx.adminId,
      },
    });
    cache = null;
    await audit(prisma, ctx, "platform.settings_updated", {
      detail: { loginMethod },
    });
  }
  return { ...(await getSettings()), ...(await loginReadiness()) };
}

/** Before switching to phone sign-in: how many active users have no phone, or share a phone. */
export async function loginReadiness() {
  const [noPhone, dupes] = await Promise.all([
    prisma.user.count({
      where: { isActive: true, OR: [{ phone: null }, { phone: "" }] },
    }),
    prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM (SELECT right(regexp_replace(phone, '\\D', '', 'g'), 10) AS p FROM "User" WHERE "isActive" AND phone IS NOT NULL AND phone <> '' GROUP BY 1 HAVING COUNT(*) > 1) d`,
  ]);
  return { usersWithoutPhone: noPhone, sharedPhones: dupes[0]?.n ?? 0 };
}
