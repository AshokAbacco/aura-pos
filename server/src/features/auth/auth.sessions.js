/**
 * Session & token mechanics shared by tenant users and platform admins.
 *
 * Access token: JWT (HS256), short TTL, carries { sub, sid, typ, tid }. Every request also
 * re-checks the session row, so revocation/disable takes effect immediately.
 * Refresh token: opaque random string; only sha256 stored. Single-use: each refresh
 * rotates it. Presenting an already-rotated token = theft signal → whole family revoked.
 */
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { prisma } from "../../core/database/prisma.js";
import { env } from "../../config/env.js";
import { randomToken, sha256, ipHash } from "../../core/utils/tokens.js";
import { unauthorized } from "../../core/errors/errors.js";

const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 }; // OWASP 2024 minimum for Argon2id
export const hashPassword = (pw) => argonHash(pw, ARGON);
export const verifyPassword = (hash, pw) =>
  hash ? argonVerify(hash, pw).catch(() => false) : Promise.resolve(false);

// Burn comparable CPU when the account doesn't exist, to blunt user enumeration by timing.
let dummyHash;
export async function verifyAgainstDummy(pw) {
  dummyHash ??= await hashPassword(crypto.randomUUID());
  await verifyPassword(dummyHash, pw);
  return false;
}

export const REFRESH_COOKIE = "aura_rt";
export const ADMIN_REFRESH_COOKIE = "aura_admin_rt";

export function signAccessToken({
  principalType,
  principalId,
  sessionId,
  tenantId,
}) {
  return jwt.sign(
    { sid: sessionId, typ: principalType, tid: tenantId ?? undefined },
    env.JWT_ACCESS_SECRET,
    {
      subject: principalId,
      audience: principalType,
      expiresIn: env.ACCESS_TOKEN_TTL_SEC,
      algorithm: "HS256",
    },
  );
}

export function verifyAccessToken(token, audience) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      audience,
      algorithms: ["HS256"],
    });
  } catch {
    throw unauthorized("Session expired or invalid");
  }
}

export async function createSession(
  { principalType, principalId, tenantId, req, familyId, ttlDays },
  db = prisma,
) {
  const refreshToken = randomToken();
  const session = await db.session.create({
    data: {
      principalType,
      principalId,
      tenantId: tenantId ?? null,
      tokenHash: sha256(refreshToken),
      familyId: familyId ?? crypto.randomUUID(),
      expiresAt: new Date(
        Date.now() + (ttlDays ?? env.REFRESH_TOKEN_TTL_DAYS) * 86400000,
      ), // slides forward on every refresh
      userAgent: req?.get?.("user-agent")?.slice(0, 255) ?? null,
      ipHash: ipHash(req?.ip),
    },
  });
  return {
    session,
    refreshToken,
    accessToken: signAccessToken({
      principalType,
      principalId,
      sessionId: session.id,
      tenantId,
    }),
  };
}

/**
 * Rotate a refresh token. Returns new tokens or throws 401 (revoking the family on reuse).
 *
 * Grace for lost responses: if the presented token was already rotated but its replacement has
 * never been used, the client most likely never received the replacement (the phone lost signal,
 * the app was closed mid-request, two tabs refreshed at the same moment). Instead of treating that
 * as theft and signing the user out, the unused replacement is cancelled and a fresh token issued.
 * Presenting a token whose replacement HAS been used is still treated as theft.
 */
export async function rotateRefreshToken(
  presented,
  principalType,
  req,
  { ttlDays, retried = false } = {},
) {
  if (!presented) throw unauthorized("No session");
  const current = await prisma.session.findUnique({
    where: { tokenHash: sha256(presented) },
  });
  if (!current || current.principalType !== principalType)
    throw unauthorized("Session not found");
  if (current.expiresAt < new Date()) throw unauthorized("Session expired");

  if (current.revokedAt || current.replacedById) {
    const successor =
      current.revokeReason === "ROTATED" && current.replacedById
        ? await prisma.session.findUnique({
            where: { id: current.replacedById },
          })
        : null;
    const unused = successor && !successor.revokedAt && !successor.replacedById;
    if (!unused) {
      // Reuse of a rotated/revoked token whose successor was used: assume theft, kill the whole family.
      await revokeFamily(current.familyId, "REFRESH_REUSE_DETECTED");
      throw unauthorized("Session revoked");
    }
    return prisma.$transaction(async (tx) => {
      const cancelled = await tx.session.updateMany({
        where: { id: successor.id, revokedAt: null, replacedById: null },
        data: { revokedAt: new Date(), revokeReason: "SUPERSEDED" },
      });
      if (cancelled.count !== 1) throw unauthorized("Session already used");
      const next = await createSession(
        {
          principalType,
          principalId: current.principalId,
          tenantId: current.tenantId,
          req,
          familyId: current.familyId,
          ttlDays,
        },
        tx,
      );
      await tx.session.update({
        where: { id: current.id },
        data: { replacedById: next.session.id, lastUsedAt: new Date() },
      });
      return {
        ...next,
        principalId: current.principalId,
        tenantId: current.tenantId,
      };
    });
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Conditional update guards against two concurrent refreshes with the same token.
      const next = await createSession(
        {
          principalType,
          principalId: current.principalId,
          tenantId: current.tenantId,
          req,
          familyId: current.familyId,
          ttlDays,
        },
        tx,
      );
      const claimed = await tx.session.updateMany({
        where: { id: current.id, replacedById: null, revokedAt: null },
        data: {
          replacedById: next.session.id,
          revokedAt: new Date(),
          revokeReason: "ROTATED",
          lastUsedAt: new Date(),
        },
      });
      if (claimed.count !== 1) throw unauthorized("Session already used");
      return {
        ...next,
        principalId: current.principalId,
        tenantId: current.tenantId,
      };
    });
  } catch (e) {
    // Lost a race with a simultaneous refresh of the same token: take the grace path once.
    if (!retried && e?.status === 401)
      return rotateRefreshToken(presented, principalType, req, {
        ttlDays,
        retried: true,
      });
    throw e;
  }
}

// "Live" = not revoked, or merely rotated (its short-lived access token may still be in use).
// Hard revocation overwrites ROTATED too, so outstanding access tokens die immediately.
const STILL_LIVE = { OR: [{ revokedAt: null }, { revokeReason: "ROTATED" }] };

export async function revokeFamily(familyId, reason) {
  await prisma.session.updateMany({
    where: { familyId, ...STILL_LIVE },
    data: { revokedAt: new Date(), revokeReason: reason },
  });
}

export async function revokeSessionByToken(presented, reason = "LOGOUT") {
  if (!presented) return;
  const s = await prisma.session.findUnique({
    where: { tokenHash: sha256(presented) },
  });
  if (s) await revokeFamily(s.familyId, reason);
}

export async function revokeAllForPrincipal(
  principalType,
  principalId,
  reason,
) {
  await prisma.session.updateMany({
    where: { principalType, principalId, ...STILL_LIVE },
    data: { revokedAt: new Date(), revokeReason: reason },
  });
}

/**
 * Marker cookie for "Remember me" turned off: when present, the refresh cookie is a browser-session
 * cookie (no maxAge), so closing the browser signs the user out. Both cookies live on the same path.
 */
export const SESSION_ONLY_COOKIE = "aura_rt_session";

/** `persistent: false` → session-only cookie (cleared when the browser closes). */
export function setRefreshCookie(res, name, token, { persistent = true } = {}) {
  const path =
    name === REFRESH_COOKIE ? "/api/v1/auth" : "/api/v1/platform/auth";
  const base = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path,
  };
  res.cookie(
    name,
    token,
    persistent
      ? { ...base, maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86400000 }
      : base,
  );
  if (name === REFRESH_COOKIE) {
    if (persistent) res.clearCookie(SESSION_ONLY_COOKIE, { path });
    else res.cookie(SESSION_ONLY_COOKIE, "1", base);
  }
}
export function clearRefreshCookie(res, name) {
  const path =
    name === REFRESH_COOKIE ? "/api/v1/auth" : "/api/v1/platform/auth";
  const opts = {
    path,
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
  };
  res.clearCookie(name, opts);
  if (name === REFRESH_COOKIE) res.clearCookie(SESSION_ONLY_COOKIE, opts);
}
