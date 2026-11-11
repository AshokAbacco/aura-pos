import {
  parse,
  ok,
  created,
  pageArgs,
  toJSONSafe,
} from "../../core/utils/http.js";
import { AppError } from "../../core/errors/errors.js";
import {
  createSession,
  rotateRefreshToken,
  revokeSessionByToken,
  setRefreshCookie,
  clearRefreshCookie,
  ADMIN_REFRESH_COOKIE,
} from "../auth/auth.sessions.js";
import * as admin from "./platform.service.js";
import {
  loginSchema,
  reasonSchema,
  contactStatusSchema,
  planSchema,
  planUpdateSchema,
  extendSchema,
  changePlanSchema,
  STATES,
} from "./platform.validation.js";

const str = (v) => (typeof v === "string" ? v.trim() : undefined);

export async function login(req, res) {
  const a = await admin.checkAdminCredentials(
    parse(loginSchema, req.body),
    req.id,
  );
  const { refreshToken, accessToken } = await createSession({
    principalType: "platform",
    principalId: a.id,
    req,
  });
  setRefreshCookie(res, ADMIN_REFRESH_COOKIE, refreshToken);
  ok(res, { accessToken });
}

export async function refresh(req, res) {
  if (req.get("x-requested-with") !== "XMLHttpRequest")
    throw new AppError(
      403,
      "CSRF_HEADER_MISSING",
      "Missing X-Requested-With header",
    );
  const { refreshToken, accessToken } = await rotateRefreshToken(
    req.cookies?.[ADMIN_REFRESH_COOKIE],
    "platform",
    req,
  );
  setRefreshCookie(res, ADMIN_REFRESH_COOKIE, refreshToken);
  ok(res, { accessToken });
}

export async function logout(req, res) {
  await revokeSessionByToken(req.cookies?.[ADMIN_REFRESH_COOKIE]);
  clearRefreshCookie(res, ADMIN_REFRESH_COOKIE);
  res.status(204).end();
}

export async function stats(_req, res) {
  ok(res, toJSONSafe(await admin.stats()));
}

export async function listTenants(req, res) {
  const { skip, take, page, pageSize } = pageArgs(req.query);
  const state = STATES.includes(req.query.state) ? req.query.state : undefined;
  const { rows, total } = await admin.listTenants({
    skip,
    take,
    q: str(req.query.q),
    state,
  });
  ok(res, toJSONSafe(rows), { page, pageSize, total });
}
export async function getTenant(req, res) {
  ok(res, toJSONSafe(await admin.getTenant(req.params.id)));
}
export async function suspend(req, res) {
  ok(
    res,
    await admin.suspendTenant(
      req.ctx,
      req.params.id,
      parse(reasonSchema, req.body).reason,
    ),
  );
}
export async function extend(req, res) {
  ok(
    res,
    toJSONSafe(
      await admin.extendSubscription(
        req.ctx,
        req.params.id,
        parse(extendSchema, req.body),
      ),
    ),
  );
}
export async function changePlan(req, res) {
  ok(
    res,
    toJSONSafe(
      await admin.changePlan(
        req.ctx,
        req.params.id,
        parse(changePlanSchema, req.body),
      ),
    ),
  );
}
export async function reactivate(req, res) {
  ok(
    res,
    await admin.reactivateTenant(
      req.ctx,
      req.params.id,
      parse(reasonSchema, req.body).reason,
    ),
  );
}

export async function listPlans(_req, res) {
  ok(res, toJSONSafe(await admin.listPlans()));
}
export async function createPlan(req, res) {
  created(
    res,
    toJSONSafe(await admin.createPlan(req.ctx, parse(planSchema, req.body))),
  );
}
export async function updatePlan(req, res) {
  ok(
    res,
    toJSONSafe(
      await admin.updatePlan(
        req.ctx,
        req.params.id,
        parse(planUpdateSchema, req.body),
      ),
    ),
  );
}

export async function listPayments(req, res) {
  const { skip, take, page, pageSize } = pageArgs(req.query);
  const { rows, total } = await admin.listPayments({ skip, take });
  ok(res, toJSONSafe(rows), { page, pageSize, total });
}
export async function listWebhooks(req, res) {
  ok(res, toJSONSafe(await admin.listWebhooks(str(req.query.status))));
}
export async function listContacts(_req, res) {
  ok(res, toJSONSafe(await admin.listContacts()));
}
export async function setContactStatus(req, res) {
  ok(
    res,
    toJSONSafe(
      await admin.setContactStatus(
        req.params.id,
        parse(contactStatusSchema, req.body).status,
      ),
    ),
  );
}

export async function listAudit(req, res) {
  const { skip, take, page, pageSize } = pageArgs(req.query);
  const { rows, total } = await admin.listAudit({
    skip,
    take,
    tenantId: str(req.query.tenantId),
    action: str(req.query.action),
  });
  ok(res, toJSONSafe(rows), { page, pageSize, total });
}
