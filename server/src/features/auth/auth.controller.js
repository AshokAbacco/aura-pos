import { parse, ok, created } from "../../core/utils/http.js";
import { AppError, unauthorized } from "../../core/errors/errors.js";
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
} from "./auth.validation.js";

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

async function startSession(req, res, user, { remember = true } = {}) {
  const { refreshToken, accessToken } = await createSession({
    principalType: "user",
    principalId: user.id,
    tenantId: user.tenantId,
    req,
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
  ok(
    res,
    tokens(
      req,
      res,
      await startSession(req, res, user, { remember: body.remember }),
    ),
  );
}

export async function refresh(req, res) {
  requireCsrfHeader(req);
  try {
    const { refreshToken, accessToken, principalId } = await rotateRefreshToken(
      incomingRefreshToken(req),
      "user",
      req,
    );
    const user = await prisma.user.findUnique({ where: { id: principalId } });
    if (!user?.isActive) throw unauthorized("Account disabled");
    issueRefresh(req, res, refreshToken, {
      persistent: !req.cookies?.[SESSION_ONLY_COOKIE],
    });
    ok(res, tokens(req, res, accessToken));
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
  const u = await auth.currentUser(req.ctx.userId);
  ok(res, {
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
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
  });
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
