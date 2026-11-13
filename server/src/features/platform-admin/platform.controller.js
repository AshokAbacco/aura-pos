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
import * as support from "./platform.support.js";
import {
  loginSchema,
  reasonSchema,
  contactStatusSchema,
  planSchema,
  planUpdateSchema,
  extendSchema,
  changePlanSchema,
  STATES,
  noteSchema,
  noteUpdateSchema,
  messageSchema,
  adminCreateSchema,
  adminUpdateSchema,
  settingsSchema,
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
  ok(res, { accessToken, admin: profile(a) });
}

const profile = (a) => ({
  id: a.id,
  name: a.name,
  email: a.email,
  role: a.role,
});
/** Who is signed in to the platform admin (name and role decide what the UI offers). */
export async function me(req, res) {
  ok(res, profile(req.ctx.admin));
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

// ── Support desk ──
const num = (v) => (v === undefined || v === "" ? undefined : Number(v));
export async function search(req, res) {
  ok(res, toJSONSafe(await support.search(req.query.q)));
}
export async function listSalons(req, res) {
  const { skip, take, page, pageSize } = pageArgs(req.query);
  const q = req.query;
  const { rows, total } = await support.listSalons({
    skip,
    take,
    q: str(q.q),
    state: STATES.includes(q.state) ? q.state : undefined,
    planId: str(q.planId),
    expiresWithin: num(q.expiresWithin),
    joinedFrom: str(q.joinedFrom),
    joinedTo: str(q.joinedTo),
    followUp: ["due", "open"].includes(q.followUp) ? q.followUp : undefined,
    sort: str(q.sort),
  });
  ok(res, toJSONSafe(rows), { page, pageSize, total });
}
export async function salonActivity(req, res) {
  const { skip, take, page, pageSize } = pageArgs(req.query);
  const { rows, total } = await support.salonActivity(req.params.id, {
    skip,
    take,
    userId: str(req.query.userId),
    action: str(req.query.action),
  });
  ok(res, toJSONSafe(rows), { page, pageSize, total });
}
export async function salonUser(req, res) {
  ok(
    res,
    toJSONSafe(await support.salonUser(req.params.id, req.params.userId)),
  );
}
export async function signOutSalonUser(req, res) {
  ok(
    res,
    await support.signOutSalonUser(
      req.ctx,
      req.params.id,
      req.params.userId,
      parse(reasonSchema, req.body).reason,
    ),
  );
}
export async function listNotes(req, res) {
  ok(res, toJSONSafe(await support.listNotes(req.params.id)));
}
export async function addNote(req, res) {
  created(
    res,
    toJSONSafe(
      await support.addNote(
        req.ctx,
        req.params.id,
        parse(noteSchema, req.body),
      ),
    ),
  );
}
export async function updateNote(req, res) {
  ok(
    res,
    toJSONSafe(
      await support.updateNote(
        req.ctx,
        req.params.noteId,
        parse(noteUpdateSchema, req.body),
      ),
    ),
  );
}
export async function followUps(req, res) {
  ok(
    res,
    toJSONSafe(
      await support.followUps({
        days: Math.min(90, num(req.query.days) ?? 14),
      }),
    ),
  );
}
export async function sendMessage(req, res) {
  created(
    res,
    await support.sendMessage(req.ctx, parse(messageSchema, req.body)),
  );
}
export async function listMessages(req, res) {
  const { skip, take, page, pageSize } = pageArgs(req.query);
  ok(
    res,
    toJSONSafe(
      await support.listMessageBatches({
        skip,
        take,
        tenantId: str(req.query.tenantId),
      }),
    ),
    { page, pageSize },
  );
}
export async function listAdmins(_req, res) {
  ok(res, toJSONSafe(await support.listAdmins()));
}
export async function createAdmin(req, res) {
  created(
    res,
    toJSONSafe(
      await support.createAdmin(req.ctx, parse(adminCreateSchema, req.body)),
    ),
  );
}
export async function updateAdmin(req, res) {
  ok(
    res,
    toJSONSafe(
      await support.updateAdmin(
        req.ctx,
        req.params.adminId,
        parse(adminUpdateSchema, req.body),
      ),
    ),
  );
}
export async function getSettings(_req, res) {
  ok(res, {
    ...(await support.getSettings()),
    ...(await support.loginReadiness()),
  });
}
export async function updateSettings(req, res) {
  ok(
    res,
    await support.updateSettings(req.ctx, parse(settingsSchema, req.body)),
  );
}
