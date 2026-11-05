/**
 * POS checkout, quote, void and refund.
 *
 * Checkout (one DB transaction; any failure rolls everything back):
 *   idempotency → load catalogue/plans/staff/customer (tenant-scoped) → permission checks for
 *   overrides/custom lines/discounts → server-side pricing → payment validation → invoice number
 *   (atomic counter) → invoice + immutable lines + payments → stock (conditional decrement) →
 *   wallet (conditional debit) → memberships + bonus credit → commissions + tips →
 *   coupon usage → customer stats → appointment completion → audit.
 * Client-submitted totals are never accepted; only item ids, quantities and (permitted) prices.
 */
import { prisma, isUniqueViolation } from "../../core/database/prisma.js";
import { dec, r2, sum } from "../../core/money/money.js";
import {
  AppError,
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../core/errors/errors.js";
import { audit } from "../../core/utils/audit.js";
import { priceInvoice } from "./pos.pricing.js";
import { commissionForLine, splitTip } from "../staff/staff.commission.js";
import { addMonthsClamped } from "../subscription/subscription.entitlements.js";
import { changeStock } from "../inventory/inventory.stock.js";
import { walletChange } from "../clients/clients.wallet.js";
import { fyLabel, invoiceNumber } from "../invoices/invoices.numbering.js";
export { getInvoice } from "../invoices/invoices.service.js";

const DEFAULT_CUSTOM_TAX = 18;

/**
 * Resolve request lines against the catalogue and price them. Shared by quote and checkout.
 * Returns everything checkout needs; performs NO writes.
 */
export async function buildPricing(ctx, body, db = prisma, { branch }) {
  const { tenant } = ctx;
  const now = new Date();
  const perms = ctx.permissions;

  const itemIds = [
    ...new Set(
      body.lines
        .filter((l) => ["SERVICE", "PRODUCT"].includes(l.type))
        .map((l) => l.itemId),
    ),
  ];
  const planIds = [
    ...new Set(
      body.lines.filter((l) => l.type === "MEMBERSHIP").map((l) => l.itemId),
    ),
  ];
  const staffIds = [
    ...new Set(body.lines.map((l) => l.staffId).filter(Boolean)),
  ];

  const [items, plans, staff, customer] = await Promise.all([
    db.catalogItem.findMany({
      where: { id: { in: itemIds }, tenantId: ctx.tenantId },
    }),
    db.membershipPlan.findMany({
      where: { id: { in: planIds }, tenantId: ctx.tenantId, isActive: true },
    }),
    db.staffProfile.findMany({
      where: { id: { in: staffIds }, tenantId: ctx.tenantId, archivedAt: null },
    }),
    body.customerId
      ? db.customer.findFirst({
          where: {
            id: body.customerId,
            tenantId: ctx.tenantId,
            archivedAt: null,
          },
        })
      : Promise.resolve(null),
  ]);
  if (body.customerId && !customer) throw badRequest("Unknown customer");
  const itemById = new Map(items.map((i) => [i.id, i]));
  const planById = new Map(plans.map((p) => [p.id, p]));
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const overrides = [];

  const lines = body.lines.map((l, idx) => {
    const n = idx + 1;
    if (l.staffId && !staffById.has(l.staffId))
      throw badRequest(`Line ${n}: unknown staff member`);
    const staffName = l.staffId ? staffById.get(l.staffId).name : null;

    if (l.type === "CUSTOM") {
      if (!perms.has("pos.custom_item"))
        throw forbidden("Missing permission: pos.custom_item");
      if (!l.description || l.unitPrice === undefined)
        throw badRequest(
          `Line ${n}: custom items need a description and price`,
        );
      const taxRate = l.taxRate ?? DEFAULT_CUSTOM_TAX;
      return {
        type: "CUSTOM",
        itemId: null,
        description: l.description,
        sacHsn: "999721",
        quantity: l.quantity,
        unitPrice: r2(l.unitPrice),
        listPrice: r2(l.unitPrice),
        taxRate,
        staffId: l.staffId ?? null,
        staffName,
        commissionEligible: true,
      };
    }

    if (l.type === "MEMBERSHIP") {
      const plan = planById.get(l.itemId);
      if (!plan)
        throw badRequest(`Line ${n}: unknown or inactive membership plan`);
      if (!customer) throw badRequest("Select a customer to sell a membership");
      if (l.quantity !== 1)
        throw badRequest(`Line ${n}: memberships are sold one at a time`);
      if (l.unitPrice !== undefined && !r2(l.unitPrice).equals(r2(plan.price)))
        throw forbidden(
          "Membership prices cannot be overridden at the counter",
        );
      return {
        type: "MEMBERSHIP",
        itemId: plan.id,
        description: `Membership: ${plan.name} (${plan.validityMonths} mo)`,
        sacHsn: "999729",
        quantity: 1,
        unitPrice: r2(plan.price),
        listPrice: r2(plan.price),
        taxRate: plan.taxRate.toString(),
        staffId: l.staffId ?? null,
        staffName,
        plan,
      };
    }

    const item = itemById.get(l.itemId);
    if (!item || item.archivedAt || !item.isActive)
      throw badRequest(`Line ${n}: item is not available`);
    if (item.type !== l.type) throw badRequest(`Line ${n}: item type mismatch`);
    let unitPrice = r2(item.price);
    if (l.unitPrice !== undefined && !r2(l.unitPrice).equals(unitPrice)) {
      if (!perms.has("pos.price_override"))
        throw forbidden("Missing permission: pos.price_override");
      if (!item.allowPriceOverride)
        throw forbidden(`${item.name} does not allow price overrides`);
      overrides.push({
        itemId: item.id,
        name: item.name,
        listPrice: unitPrice.toFixed(2),
        charged: r2(l.unitPrice).toFixed(2),
      });
      unitPrice = r2(l.unitPrice);
    }
    return {
      type: item.type,
      itemId: item.id,
      description: item.name,
      sacHsn: item.sacHsn,
      quantity: l.quantity,
      unitPrice,
      listPrice: r2(item.price),
      taxRate: item.taxRate.toString(),
      staffId: l.staffId ?? null,
      staffName,
      commissionEligible: item.commissionEligible,
    };
  });

  // ── Offer (one per invoice, like the prototype's single "Discount Offer" select)
  let offer = null,
    coupon = null,
    membership = null;
  const kind = body.offer?.kind ?? "NONE";
  if (kind === "MEMBERSHIP") {
    if (!customer)
      throw badRequest("Select a customer to apply a membership discount");
    membership = await db.customerMembership.findFirst({
      where: {
        tenantId: ctx.tenantId,
        customerId: customer.id,
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      include: { plan: true },
      orderBy: { plan: { discountPercent: "desc" } },
    });
    if (!membership)
      throw new AppError(
        422,
        "NO_ACTIVE_MEMBERSHIP",
        "This customer has no active membership",
      );
    offer = {
      kind: "MEMBERSHIP",
      percent: membership.plan.discountPercent.toString(),
      appliesToServices: membership.plan.appliesToServices,
      appliesToProducts: membership.plan.appliesToProducts,
      planName: membership.plan.name,
    };
  } else if (kind === "COUPON") {
    if (!perms.has("pos.discount"))
      throw forbidden("Missing permission: pos.discount");
    coupon = await db.coupon.findFirst({
      where: {
        tenantId: ctx.tenantId,
        code: String(body.offer.couponCode ?? "").toUpperCase(),
        isActive: true,
      },
    });
    if (!coupon)
      throw new AppError(422, "COUPON_INVALID", "Coupon code is not valid");
    if (
      (coupon.validFrom && coupon.validFrom > now) ||
      (coupon.validTo && coupon.validTo < now)
    )
      throw new AppError(422, "COUPON_EXPIRED", "Coupon is not valid today");
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
      throw new AppError(422, "COUPON_EXHAUSTED", "Coupon usage limit reached");
    if (coupon.firstVisitOnly && (!customer || customer.visitCount > 0))
      throw new AppError(
        422,
        "COUPON_FIRST_VISIT_ONLY",
        "Coupon is valid on a first visit only",
      );
    offer = {
      kind: "COUPON",
      couponKind: coupon.kind,
      value: coupon.value.toString(),
      code: coupon.code,
    };
  }

  const priced = priceInvoice({
    lines,
    offer,
    tip: body.tip ?? 0,
    pricesIncludeTax: tenant.pricesIncludeTax,
    roundOff: tenant.roundOffInvoice,
    intraState: true, // in-person salon services & counter sales: place of supply = branch state
  });
  if (coupon && priced.subtotal.lessThan(dec(coupon.minSubtotal)))
    throw new AppError(
      422,
      "COUPON_MIN_SUBTOTAL",
      `Coupon needs a minimum bill of ₹${coupon.minSubtotal}`,
    );

  return { priced, customer, staffById, coupon, membership, overrides, branch };
}

export async function quote(ctx, body, branch) {
  const { priced } = await buildPricing(ctx, body, prisma, { branch });
  return priced;
}

function sellerSnapshot(tenant, branch) {
  return {
    legalName: tenant.legalName,
    displayName: tenant.displayName,
    tagline: tenant.tagline,
    gstin: tenant.gstin,
    branchName: branch.name,
    branchCode: branch.code,
    address: branch.address,
    phone: branch.phone,
    email: branch.email,
    upiId: branch.upiId,
    stateCode: branch.stateCode ?? tenant.stateCode,
    receiptFooter: branch.receiptFooter,
  };
}

export async function checkout(ctx, body, branch, idempotencyKey) {
  const existing = await prisma.invoice.findUnique({
    where: {
      tenantId_idempotencyKey: { tenantId: ctx.tenantId, idempotencyKey },
    },
  });
  if (existing) return { invoiceId: existing.id, replayed: true };

  try {
    return await prisma.$transaction(async (tx) => {
      const { priced, customer, staffById, coupon, membership, overrides } =
        await buildPricing(ctx, body, tx, { branch });
      const grand = priced.grandTotal;

      // ── Payments
      const payments = (body.payments ?? []).map((p) => ({
        ...p,
        amount: r2(p.amount),
      }));
      if (payments.some((p) => p.amount.lessThanOrEqualTo(0)))
        throw badRequest("Payment amounts must be positive");
      const paid = sum(payments, (p) => p.amount);
      if (paid.greaterThan(grand))
        throw new AppError(
          422,
          "OVERPAYMENT",
          `Payments (₹${paid.toFixed(2)}) exceed the bill (₹${grand.toFixed(2)}). Record cash tendered net of change.`,
        );
      if (paid.lessThan(grand)) {
        if (!body.allowPartial)
          throw new AppError(
            422,
            "PAYMENT_SHORT",
            `Payments (₹${paid.toFixed(2)}) do not cover the bill (₹${grand.toFixed(2)})`,
          );
        if (!customer)
          throw badRequest("A customer is required to leave a balance due");
      }
      const walletTotal = sum(
        payments.filter((p) => p.method === "WALLET"),
        (p) => p.amount,
      );
      if (walletTotal.greaterThan(0) && !customer)
        throw badRequest("Select a customer to pay from wallet");
      const status = paid.equals(grand)
        ? "PAID"
        : paid.isZero()
          ? "UNPAID"
          : "PARTIALLY_PAID";

      // ── Appointment link
      let appointment = null;
      if (body.appointmentId) {
        appointment = await tx.appointment.findFirst({
          where: {
            id: body.appointmentId,
            tenantId: ctx.tenantId,
            branchId: branch.id,
          },
        });
        if (!appointment)
          throw badRequest("Unknown appointment for this branch");
        if (
          appointment.invoiceId ||
          ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status)
        )
          throw conflict(
            "APPOINTMENT_CLOSED",
            `Appointment is already ${appointment.status.toLowerCase()}`,
          );
      }

      // ── Invoice number (row lock on the branch counter serialises numbering)
      const [{ seq }] = await tx.$queryRaw`
        UPDATE "Branch" SET "nextInvoiceNumber" = "nextInvoiceNumber" + 1
        WHERE "id" = ${branch.id}::uuid AND "tenantId" = ${ctx.tenantId}::uuid
        RETURNING "nextInvoiceNumber" - 1 AS seq`;
      const now = new Date();
      const number = invoiceNumber(
        branch.code,
        fyLabel(now, ctx.tenant.timezone),
        seq,
      );

      const invoice = await tx.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          branchId: branch.id,
          number,
          idempotencyKey,
          kind: "INVOICE",
          customerId: customer?.id ?? null,
          appointmentId: appointment?.id ?? null,
          cashierUserId: ctx.userId,
          status,
          customerSnapshot: customer
            ? {
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                membership: membership?.plan.name ?? null,
              }
            : undefined,
          sellerSnapshot: sellerSnapshot(ctx.tenant, branch),
          placeOfSupply: branch.stateCode ?? ctx.tenant.stateCode,
          pricesIncludeTax: ctx.tenant.pricesIncludeTax,
          subtotal: priced.subtotal.toFixed(2),
          discountTotal: priced.discountTotal.toFixed(2),
          taxableTotal: priced.taxableTotal.toFixed(2),
          cgstTotal: priced.cgstTotal.toFixed(2),
          sgstTotal: priced.sgstTotal.toFixed(2),
          igstTotal: priced.igstTotal.toFixed(2),
          taxTotal: priced.taxTotal.toFixed(2),
          tip: priced.tip.toFixed(2),
          roundOff: priced.roundOff.toFixed(2),
          grandTotal: grand.toFixed(2),
          amountPaid: paid.toFixed(2),
          amountDue: grand.minus(paid).toFixed(2),
          discountSnapshot: priced.offer ? { ...priced.offer } : undefined,
          issuedAt: now,
          lines: {
            create: priced.lines.map((l, i) => ({
              lineNo: i + 1,
              type: l.type,
              itemId: l.itemId,
              description: l.description,
              sacHsn: l.sacHsn ?? null,
              staffId: l.staffId,
              staffName: l.staffName,
              quantity: l.quantity,
              unitPrice: l.unitPrice.toFixed(2),
              listPrice: dec(l.listPrice).toFixed(2),
              grossAmount: l.grossAmount.toFixed(2),
              discountAmount: l.discountAmount.toFixed(2),
              taxableAmount: l.taxableAmount.toFixed(2),
              taxRate: l.taxRate.toString(),
              cgstAmount: l.cgstAmount.toFixed(2),
              sgstAmount: l.sgstAmount.toFixed(2),
              igstAmount: l.igstAmount.toFixed(2),
              totalAmount: l.totalAmount.toFixed(2),
            })),
          },
          payments: {
            create: payments.map((p) => ({
              tenantId: ctx.tenantId,
              method: p.method,
              amount: p.amount.toFixed(2),
              reference: p.reference ?? null,
            })),
          },
        },
        include: { lines: { orderBy: { lineNo: "asc" } } },
      });

      // ── Stock (aggregate per item; conditional decrement — never oversell)
      const qtyByItem = new Map();
      for (const l of priced.lines)
        if (l.type === "PRODUCT")
          qtyByItem.set(l.itemId, (qtyByItem.get(l.itemId) ?? 0) + l.quantity);
      for (const [itemId, qty] of [...qtyByItem].sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        // fixed order avoids deadlocks
        const name = priced.lines.find((l) => l.itemId === itemId).description;
        await changeStock(tx, {
          tenantId: ctx.tenantId,
          branchId: branch.id,
          itemId,
          delta: -qty,
          type: "SALE",
          reference: number,
          invoiceId: invoice.id,
          actorUserId: ctx.userId,
          itemName: name,
        });
      }

      // ── Wallet redemption
      if (walletTotal.greaterThan(0)) {
        await walletChange(tx, {
          tenantId: ctx.tenantId,
          customerId: customer.id,
          amount: walletTotal.negated(),
          type: "REDEMPTION",
          invoiceId: invoice.id,
          reason: `Invoice ${number}`,
          actorUserId: ctx.userId,
        });
      }

      // ── Membership enrolment + bonus credit (fixes D8)
      for (const l of priced.lines.filter((x) => x.type === "MEMBERSHIP")) {
        const startsAt = now;
        await tx.customerMembership.create({
          data: {
            tenantId: ctx.tenantId,
            customerId: customer.id,
            planId: l.plan.id,
            startsAt,
            endsAt: addMonthsClamped(startsAt, l.plan.validityMonths),
            invoiceId: invoice.id,
          },
        });
        if (dec(l.plan.bonusWalletCredit).greaterThan(0)) {
          await walletChange(tx, {
            tenantId: ctx.tenantId,
            customerId: customer.id,
            amount: l.plan.bonusWalletCredit,
            type: "BONUS",
            invoiceId: invoice.id,
            reason: `${l.plan.name} joining bonus`,
            actorUserId: ctx.userId,
          });
        }
      }

      // ── Commissions (rates snapshotted) and tips
      const commissionRows = [];
      invoice.lines.forEach((line, i) => {
        const src = priced.lines[i];
        const c = commissionForLine(src, staffById.get(src.staffId), {
          eligible: src.commissionEligible !== false,
        });
        if (c)
          commissionRows.push({
            tenantId: ctx.tenantId,
            staffId: src.staffId,
            invoiceId: invoice.id,
            invoiceLineId: line.id,
            kind: c.kind,
            baseAmount: c.baseAmount.toFixed(2),
            ratePercent: c.ratePercent.toString(),
            amount: c.amount.toFixed(2),
          });
      });
      const serviceStaff = priced.lines
        .filter((l) => l.type !== "PRODUCT" && l.staffId)
        .map((l) => l.staffId);
      for (const t of splitTip(priced.tip, serviceStaff)) {
        commissionRows.push({
          tenantId: ctx.tenantId,
          staffId: t.staffId,
          invoiceId: invoice.id,
          kind: "TIP",
          baseAmount: t.amount.toFixed(2),
          ratePercent: "100",
          amount: t.amount.toFixed(2),
        });
      }
      if (commissionRows.length)
        await tx.commissionEntry.createMany({ data: commissionRows });

      // ── Coupon usage (conditional to respect maxUses under concurrency)
      if (coupon) {
        const { count } = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            ...(coupon.maxUses !== null
              ? { usedCount: { lt: coupon.maxUses } }
              : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (!count)
          throw new AppError(
            422,
            "COUPON_EXHAUSTED",
            "Coupon usage limit reached",
          );
      }

      // ── Customer stats (lifetime spend excludes tips)
      if (customer) {
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            visitCount: { increment: 1 },
            lifetimeSpend: { increment: grand.minus(priced.tip).toFixed(2) },
            lastVisitAt: now,
          },
        });
      }

      // ── Floor plan: close the chair's open ticket with this invoice (fails if another screen already billed it)
      if (body.chairTicketId) {
        const { count } = await tx.chairTicket.deleteMany({
          where: {
            id: body.chairTicketId,
            tenantId: ctx.tenantId,
            branchId: branch.id,
            ...(body.chairTicketVersion
              ? { version: body.chairTicketVersion }
              : {}),
          },
        });
        if (!count)
          throw conflict(
            "TICKET_CLOSED",
            "This chair was billed, cleared or changed on another screen. Reload and try again.",
          );
      }

      // ── Appointment completion
      if (appointment) {
        const { count } = await tx.appointment.updateMany({
          where: { id: appointment.id, invoiceId: null },
          data: { status: "COMPLETED", invoiceId: invoice.id },
        });
        if (!count)
          throw conflict(
            "APPOINTMENT_CLOSED",
            "Appointment was billed by another checkout",
          );
      }

      await audit(tx, ctx, "invoice.create", {
        entityType: "Invoice",
        entityId: invoice.id,
        detail: { number, grandTotal: grand.toFixed(2), status },
      });
      if (overrides.length)
        await audit(tx, ctx, "pos.price_override", {
          entityType: "Invoice",
          entityId: invoice.id,
          detail: { overrides },
        });
      return { invoiceId: invoice.id, replayed: false };
    });
  } catch (err) {
    // Two concurrent requests with the same key: the loser returns the winner's invoice.
    if (
      isUniqueViolation(err) &&
      /idempotencyKey/.test(JSON.stringify(err.meta ?? err.message))
    ) {
      const inv = await prisma.invoice.findUnique({
        where: {
          tenantId_idempotencyKey: { tenantId: ctx.tenantId, idempotencyKey },
        },
      });
      if (inv) return { invoiceId: inv.id, replayed: true };
    }
    throw err;
  }
}

// ───────────── Parked carts and coupons ─────────────

export const listParked = (ctx, branchId) =>
  prisma.parkedCart.findMany({
    where: { tenantId: ctx.tenantId, branchId },
    orderBy: { updatedAt: "desc" },
  });

export const parkCart = (ctx, branchId, { label, cart }) =>
  prisma.parkedCart.create({
    data: {
      tenantId: ctx.tenantId,
      branchId,
      label,
      payload: cart,
      userId: ctx.userId,
    },
  });

export async function deleteParked(ctx, id) {
  const { count } = await prisma.parkedCart.deleteMany({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!count) throw notFound("Parked cart");
}

export const listCoupons = (ctx, all) =>
  prisma.coupon.findMany({
    where: { tenantId: ctx.tenantId, ...(all ? {} : { isActive: true }) },
    orderBy: { code: "asc" },
  });

export async function createCoupon(ctx, d) {
  try {
    const c = await prisma.coupon.create({
      data: {
        ...d,
        value: d.value.toFixed(2),
        minSubtotal: d.minSubtotal.toFixed(2),
        tenantId: ctx.tenantId,
      },
    });
    await audit(prisma, ctx, "coupon.create", {
      entityType: "Coupon",
      entityId: c.id,
    });
    return c;
  } catch (e) {
    if (isUniqueViolation(e))
      throw conflict("DUPLICATE", "Coupon code already exists");
    throw e;
  }
}
