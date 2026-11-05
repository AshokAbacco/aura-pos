/** POS controllers: parse the request, call the service, shape the response. No business rules here. */
import { parse, ok, created, toJSONSafe } from "../../core/utils/http.js";
import { badRequest, forbidden } from "../../core/errors/errors.js";
import { resolveBranch } from "../../core/utils/branch.js";
import { serialisePriced } from "./pos.pricing.js";
import * as pos from "./pos.service.js";
import * as chairs from "./pos.chairs.js";
import {
  cartSchema,
  idempotencyKey,
  parkSchema,
  couponSchema,
  ticketSchema,
  clearTicketSchema,
  moveTicketSchema,
} from "./pos.validation.js";

/** Live totals for the cart UI. Same engine as checkout; no writes. */
export async function quote(req, res) {
  const body = parse(cartSchema, req.body);
  const branch = await resolveBranch(req, body.branchId);
  ok(
    res,
    serialisePriced(
      await pos.quote(
        req.ctx,
        { ...body, customerId: body.customerId ?? undefined },
        branch,
      ),
    ),
  );
}

export async function checkout(req, res) {
  const key = parse(idempotencyKey, req.get("idempotency-key") ?? "");
  const body = parse(cartSchema, req.body);
  if (!body.payments?.length && !body.allowPartial)
    throw badRequest("Add at least one payment");
  if (body.allowPartial && !["OWNER", "MANAGER"].includes(req.ctx.role))
    throw forbidden("Only owners and managers can leave a balance due");
  const branch = await resolveBranch(req, body.branchId);
  const result = await pos.checkout(
    req.ctx,
    { ...body, customerId: body.customerId ?? undefined },
    branch,
    key,
  );
  const invoice = await pos.getInvoice(req.ctx, result.invoiceId);
  res
    .status(result.replayed ? 200 : 201)
    .json({ data: toJSONSafe(invoice), meta: { replayed: result.replayed } });
}

export async function listParked(req, res) {
  const branch = await resolveBranch(req);
  ok(res, toJSONSafe(await pos.listParked(req.ctx, branch.id)));
}

export async function parkCart(req, res) {
  const body = parse(parkSchema, req.body);
  const branch = await resolveBranch(req);
  created(res, toJSONSafe(await pos.parkCart(req.ctx, branch.id, body)));
}

export async function deleteParked(req, res) {
  await pos.deleteParked(req.ctx, req.params.id);
  res.status(204).end();
}

export async function listCoupons(req, res) {
  ok(res, toJSONSafe(await pos.listCoupons(req.ctx, req.query.all === "true")));
}

export async function createCoupon(req, res) {
  created(
    res,
    toJSONSafe(await pos.createCoupon(req.ctx, parse(couponSchema, req.body))),
  );
}

// ───────────── Floor plan (chairs and their open tickets) ─────────────
export async function floor(req, res) {
  ok(res, toJSONSafe(await chairs.floor(req.ctx, await resolveBranch(req))));
}
export async function getChair(req, res) {
  ok(
    res,
    toJSONSafe(
      await chairs.getChair(
        req.ctx,
        await resolveBranch(req),
        req.params.resourceId,
      ),
    ),
  );
}
export async function saveTicket(req, res) {
  const body = parse(ticketSchema, req.body);
  ok(
    res,
    toJSONSafe(
      await chairs.saveTicket(
        req.ctx,
        await resolveBranch(req),
        req.params.resourceId,
        body,
      ),
    ),
  );
}
export async function clearTicket(req, res) {
  await chairs.clearTicket(
    req.ctx,
    await resolveBranch(req),
    req.params.resourceId,
    parse(clearTicketSchema, req.body ?? {}).reason,
  );
  res.status(204).end();
}
export async function moveTicket(req, res) {
  const { toResourceId } = parse(moveTicketSchema, req.body);
  ok(
    res,
    toJSONSafe(
      await chairs.moveTicket(
        req.ctx,
        await resolveBranch(req),
        req.params.resourceId,
        toResourceId,
      ),
    ),
  );
}
