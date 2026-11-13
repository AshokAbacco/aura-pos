import { parse, ok, created } from "../../core/utils/http.js";
import { AppError, unauthorized } from "../../core/errors/errors.js";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { env } from "../../config/env.js";
import { prisma } from "../../core/database/prisma.js";
import { entitlementSummary } from "../subscription/subscription.summary.js";
import {
  createSession,
  rotateRefreshToken,
  revokeSessionByToken,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE,
  SESSION_ONLY_COOKIE,
  hashPassword,
} from "./auth.sessions.js";
import * as auth from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  tokenSchema,
  emailSchema,
  resetSchema,
  changePasswordSchema,
  acceptInviteSchema,
  profileSchema,
} from "./auth.validation.js";
import { audit } from "../../core/utils/audit.js";

/** Cookie-authenticated endpoints require a header that cross-site forms cannot send (CSRF guard). */
function requireCsrfHeader(req) {
  if (req.get("x-requested-with") !== "XMLHttpRequest")
    throw new AppError(
      403,
      "CSRF_HEADER_MISSING",
      "Missing X-Requested-With header",
    );
}

/**
 * The Android app (Capacitor) runs on its own origin, and Android's WebView refuses cookies set by
 * another site, so the HttpOnly refresh cookie can't work there. The app identifies itself with
 * `X-Client-Platform: native`; it then receives the refresh token in the response body, keeps it in
 * the device's app storage, and sends it back in the body to /refresh and /logout. Browsers keep
 * using the cookie only. The token is the same rotating, hashed, reuse-detecting refresh token.
 */
const isNative = (req) => req.get("x-client-platform") === "native";
function incomingRefreshToken(req) {
  const fromCookie = req.cookies?.[REFRESH_COOKIE];
  if (fromCookie) return fromCookie;
  const fromBody = isNative(req) ? req.body?.refreshToken : undefined;
  return typeof fromBody === "string" && fromBody.length <= 200
    ? fromBody
    : undefined;
}
function issueRefresh(req, res, refreshToken, { persistent = true } = {}) {
  if (isNative(req)) res.locals.refreshToken = refreshToken;
  else setRefreshCookie(res, REFRESH_COOKIE, refreshToken, { persistent });
}
/** Response body for a new session: the access token, plus the refresh token for the app. */
const tokens = (req, res, accessToken) => ({
  accessToken,
  ...(isNative(req) ? { refreshToken: res.locals.refreshToken } : {}),
});

const ttlFor = (req) =>
  isNative(req)
    ? env.REFRESH_TOKEN_TTL_DAYS_NATIVE
    : env.REFRESH_TOKEN_TTL_DAYS;

async function startSession(req, res, user, { remember = true } = {}) {
  const { refreshToken, accessToken } = await createSession({
    principalType: "user",
    principalId: user.id,
    tenantId: user.tenantId,
    req,
    ttlDays: ttlFor(req),
  });
  issueRefresh(req, res, refreshToken, { persistent: remember });
  return accessToken;
}

export async function register(req, res) {
  const body = parse(registerSchema, req.body);
  const { user, tenant } = await auth.registerTenant({
    ...body,
    passwordHash: await hashPassword(body.password),
  });
  await auth.sendVerificationEmail(user);
  const accessToken = await startSession(req, res, user);
  created(res, {
    ...tokens(req, res, accessToken),
    user: { id: user.id, email: user.email, name: user.name },
    tenant: { id: tenant.id, displayName: tenant.displayName },
  });
}

export async function login(req, res) {
  const body = parse(loginSchema, req.body);
  const user = await auth.checkCredentials(body, req.id);
  const accessToken = await startSession(req, res, user, {
    remember: body.remember,
  });
  ok(res, {
    ...tokens(req, res, accessToken),
    ...(await withMe(req, accessToken)),
  });
}

/**
 * `?include=me` on login/refresh also returns what GET /auth/me would, in the same response:
 * one round trip instead of two when the app opens or someone signs in.
 */
async function withMe(req, accessToken) {
  if (req.query?.include !== "me") return {};
  try {
    req.headers.authorization = `Bearer ${accessToken}`;
    await authenticate(req, null, () => {});
    return { me: await mePayload(req) };
  } catch {
    return {};
  } // the client falls back to GET /auth/me
}

export async function refresh(req, res) {
  requireCsrfHeader(req);
  try {
    const { refreshToken, accessToken, principalId } = await rotateRefreshToken(
      incomingRefreshToken(req),
      "user",
      req,
      { ttlDays: ttlFor(req) },
    );
    const user = await prisma.user.findUnique({ where: { id: principalId } });
    if (!user?.isActive) throw unauthorized("Account disabled");
    issueRefresh(req, res, refreshToken, {
      persistent: !req.cookies?.[SESSION_ONLY_COOKIE],
    });
    ok(res, {
      ...tokens(req, res, accessToken),
      ...(await withMe(req, accessToken)),
    });
  } catch (err) {
    clearRefreshCookie(res, REFRESH_COOKIE);
    throw err;
  }
}

export async function logout(req, res) {
  requireCsrfHeader(req);
  await revokeSessionByToken(incomingRefreshToken(req), "LOGOUT");
  clearRefreshCookie(res, REFRESH_COOKIE);
  res.status(204).end();
}

export async function me(req, res) {
  ok(res, await mePayload(req));
}

/** Update your own name / mobile number. Any signed-in user, including the owner. */
export async function updateProfile(req, res) {
  const body = parse(profileSchema, req.body);
  const data = {
    ...(body.name ? { name: body.name } : {}),
    ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
  };
  await prisma.user.update({ where: { id: req.ctx.userId }, data });
  await audit(prisma, req.ctx, "user.profile_update", {
    entityType: "User",
    entityId: req.ctx.userId,
    detail: { name: !!body.name, phone: body.phone !== undefined },
  });
  ok(res, await mePayload(req));
}

async function mePayload(req) {
  const u = await auth.currentUser(req.ctx.userId);
  return {
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      emailVerified: !!u.emailVerifiedAt,
    },
    tenant: {
      id: u.tenant.id,
      displayName: u.tenant.displayName,
      tagline: u.tenant.tagline,
      gstin: u.tenant.gstin,
      status: u.tenant.status,
      pricesIncludeTax: u.tenant.pricesIncludeTax,
    },
    branches: u.tenant.branches
      .filter((b) => !req.ctx.branchIds || req.ctx.branchIds.includes(b.id))
      .map((b) => ({ id: b.id, name: b.name, code: b.code })),
    permissions: [...req.ctx.permissions].sort(),
    entitlement: entitlementSummary(req.ctx.entitlement, req.ctx.subscription),
  };
}

export async function verifyEmail(req, res) {
  await auth.verifyEmail(parse(tokenSchema, req.body).token);
  ok(res, { verified: true });
}

export async function resendVerification(req, res) {
  if (req.ctx.user.emailVerifiedAt) return ok(res, { alreadyVerified: true });
  await auth.sendVerificationEmail(req.ctx.user);
  ok(res, { sent: true });
}

export async function forgotPassword(req, res) {
  await auth.requestPasswordReset(parse(emailSchema, req.body).email);
  res
    .status(202)
    .json({
      data: {
        message:
          "If an account exists for that email, a reset link has been sent.",
      },
    });
}

export async function resetPassword(req, res) {
  await auth.resetPassword(parse(resetSchema, req.body));
  ok(res, { reset: true });
}

export async function changePassword(req, res) {
  await auth.changePassword(
    req.ctx.user,
    parse(changePasswordSchema, req.body),
  );
  clearRefreshCookie(res, REFRESH_COOKIE);
  ok(res, { changed: true, reauthenticate: true });
}

export async function acceptInvite(req, res) {
  const user = await auth.acceptInvite(parse(acceptInviteSchema, req.body));
  ok(res, tokens(req, res, await startSession(req, res, user)));
}

export async function listSessions(req, res) {
  ok(res, await auth.listSessions(req.ctx.userId));
}

export async function revokeSession(req, res) {
  await auth.revokeSession(req.ctx.userId, req.params.id);
  res.status(204).end();
}
