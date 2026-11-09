import { describe, it, expect, beforeAll } from "vitest";
import {
  api,
  prisma,
  outbox,
  resetDb,
  seedPlans,
  registerSalon,
  client,
} from "../helpers/helpers.js";
import { hashPassword } from "../../src/features/auth/auth.sessions.js";

const cookieValue = (setCookie, name) =>
  setCookie?.find((c) => c.startsWith(`${name}=`))?.split(";")[0];
const refresh = (cookie) =>
  api()
    .post("/api/v1/auth/refresh")
    .set("Cookie", cookie)
    .set("X-Requested-With", "XMLHttpRequest");

beforeAll(async () => {
  await resetDb();
  await seedPlans();
});

describe("registration & onboarding", () => {
  it("creates tenant, owner, branch, default categories and a trial; sends verification email", async () => {
    const s = await registerSalon("Glow Studio", { verify: false });
    const me = (await s.get("/api/v1/auth/me")).body.data;
    expect(me.user.role).toBe("OWNER");
    expect(me.user.emailVerified).toBe(false);
    expect(me.entitlement.state).toBe("TRIAL");
    expect(me.entitlement.writable).toBe(true);
    expect(me.branches).toHaveLength(1);
    expect(
      (await s.get("/api/v1/catalog/categories")).body.data.map((c) => c.name),
    ).toEqual(["Hair", "Skin & Spa", "Nails", "Retail"]);

    const mail = outbox.find(
      (m) => m.to === s.email && /Verify/.test(m.subject),
    );
    const token = mail.text.match(/token=([\w-]+)/)[1];
    expect(
      (await api().post("/api/v1/auth/verify-email").send({ token })).status,
    ).toBe(200);
    expect((await s.get("/api/v1/auth/me")).body.data.user.emailVerified).toBe(
      true,
    );
    // single use
    expect(
      (await api().post("/api/v1/auth/verify-email").send({ token })).status,
    ).toBe(400);
  });

  it("rejects duplicate emails, weak passwords and missing terms", async () => {
    const s = await registerSalon("Dup Check");
    const base = {
      name: "X Y",
      password: "correct-horse-battery",
      phone: "+919800000000",
      salonName: "Other",
      acceptTerms: true,
    };
    expect(
      (
        await api()
          .post("/api/v1/auth/register")
          .send({ ...base, email: s.email })
      ).body.error.code,
    ).toBe("EMAIL_TAKEN");
    expect(
      (
        await api()
          .post("/api/v1/auth/register")
          .send({ ...base, email: "new@x.test", password: "short" })
      ).status,
    ).toBe(400);
    expect(
      (
        await api()
          .post("/api/v1/auth/register")
          .send({ ...base, email: "new2@x.test", acceptTerms: false })
      ).status,
    ).toBe(400);
  });
});

describe("login, refresh rotation and logout", () => {
  it("does not reveal whether an account exists", async () => {
    const s = await registerSalon("Enum");
    const wrong = await api()
      .post("/api/v1/auth/login")
      .send({ email: s.email, password: "wrong-password-xx" });
    const missing = await api()
      .post("/api/v1/auth/login")
      .send({ email: "nobody@nowhere.test", password: "wrong-password-xx" });
    expect(wrong.status).toBe(401);
    expect(missing.status).toBe(401);
    expect(wrong.body.error.message).toBe(missing.body.error.message);
  });

  it("rotates refresh tokens and revokes the whole family on reuse", async () => {
    const s = await registerSalon("Rotate");
    const rt1 = cookieValue(s.cookies, "aura_rt");
    const r1 = await refresh(rt1);
    expect(r1.status).toBe(200);
    const rt2 = cookieValue(r1.headers["set-cookie"], "aura_rt");
    expect(rt2).not.toBe(rt1);

    // Reusing the old token = theft signal → everything in the family dies, incl. rt2 and its access token.
    expect((await refresh(rt1)).status).toBe(401);
    expect((await refresh(rt2)).status).toBe(401);
    expect(
      (await client(r1.body.data.accessToken).get("/api/v1/auth/me")).status,
    ).toBe(401);
  });

  it("requires the CSRF header on cookie-authenticated refresh", async () => {
    const s = await registerSalon("Csrf");
    const res = await api()
      .post("/api/v1/auth/refresh")
      .set("Cookie", cookieValue(s.cookies, "aura_rt"));
    expect(res.body.error.code).toBe("CSRF_HEADER_MISSING");
  });

  it("logout invalidates the access token immediately (not at expiry)", async () => {
    const s = await registerSalon("Logout");
    expect((await s.get("/api/v1/auth/me")).status).toBe(200);
    await api()
      .post("/api/v1/auth/logout")
      .set("Cookie", cookieValue(s.cookies, "aura_rt"))
      .set("X-Requested-With", "XMLHttpRequest")
      .expect(204);
    expect((await s.get("/api/v1/auth/me")).status).toBe(401);
  });

  it("password reset is single-use and revokes existing sessions", async () => {
    const s = await registerSalon("Reset");
    await api()
      .post("/api/v1/auth/forgot-password")
      .send({ email: s.email })
      .expect(202);
    await api()
      .post("/api/v1/auth/forgot-password")
      .send({ email: "ghost@x.test" })
      .expect(202);
    const token = outbox
      .filter((m) => m.to === s.email && /Reset/.test(m.subject))
      .at(-1)
      .text.match(/token=([\w-]+)/)[1];
    await api()
      .post("/api/v1/auth/reset-password")
      .send({ token, password: "brand-new-password-1" })
      .expect(200);
    expect((await s.get("/api/v1/auth/me")).status).toBe(401);
    expect(
      (
        await api()
          .post("/api/v1/auth/reset-password")
          .send({ token, password: "another-password-2" })
      ).status,
    ).toBe(400);
    expect(
      (
        await api()
          .post("/api/v1/auth/login")
          .send({ email: s.email, password: "brand-new-password-1" })
      ).status,
    ).toBe(200);
  });

  it("a disabled user loses access on the very next request", async () => {
    const s = await registerSalon("Disable");
    await prisma.user.updateMany({
      where: { email: s.email },
      data: { isActive: false },
    });
    expect((await s.get("/api/v1/auth/me")).status).toBe(401);
  });
});

describe("platform vs tenant principals", () => {
  it("tenant tokens cannot reach platform routes and vice versa", async () => {
    const s = await registerSalon("Principal");
    expect((await s.get("/api/v1/platform/tenants")).status).toBe(401);

    await prisma.platformAdmin.create({
      data: {
        email: "pa@aura.test",
        name: "PA",
        passwordHash: await hashPassword("platform-password-1"),
      },
    });
    const login = await api()
      .post("/api/v1/platform/auth/login")
      .send({ email: "pa@aura.test", password: "platform-password-1" });
    expect(login.status).toBe(200);
    const admin = client(login.body.data.accessToken);
    expect((await admin.get("/api/v1/platform/tenants")).status).toBe(200);
    expect((await admin.get("/api/v1/auth/me")).status).toBe(401);
    expect((await admin.get("/api/v1/catalog/items")).status).toBe(401);
  });
});

describe("remember me", () => {
  const PASSWORD = "correct-horse-battery";
  it("remember=false issues a browser-session refresh cookie that stays session-only after rotation", async () => {
    const s = await registerSalon("Remember Off");
    await prisma.user.update({
      where: { email: s.email },
      data: { passwordHash: await hashPassword(PASSWORD) },
    });
    const r = await api()
      .post("/api/v1/auth/login")
      .send({ email: s.email, password: PASSWORD, remember: false });
    expect(r.status).toBe(200);
    const rt = r.headers["set-cookie"].find((c) => c.startsWith("aura_rt="));
    expect(rt).not.toMatch(/Max-Age|Expires/i);
    const marker = cookieValue(r.headers["set-cookie"], "aura_rt_session");
    expect(marker).toBeTruthy();
    const r2 = await refresh(
      `${cookieValue(r.headers["set-cookie"], "aura_rt")}; ${marker}`,
    );
    expect(r2.status).toBe(200);
    expect(
      r2.headers["set-cookie"].find((c) => c.startsWith("aura_rt=")),
    ).not.toMatch(/Max-Age|Expires/i);
  });

  it("remember defaults to a persistent cookie", async () => {
    const s = await registerSalon("Remember On");
    await prisma.user.update({
      where: { email: s.email },
      data: { passwordHash: await hashPassword(PASSWORD) },
    });
    const r = await api()
      .post("/api/v1/auth/login")
      .send({ email: s.email, password: PASSWORD });
    expect(
      r.headers["set-cookie"].find((c) => c.startsWith("aura_rt=")),
    ).toMatch(/Max-Age/i);
  });
});

describe("Android app (native) sessions", () => {
  const PASSWORD = "correct-horse-battery";
  const native = (req) =>
    req
      .set("X-Client-Platform", "native")
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Origin", "https://localhost");

  it("gets the refresh token in the body (no cookie), rotates it, detects reuse and logs out", async () => {
    const s = await registerSalon("Native App");
    await prisma.user.update({
      where: { email: s.email },
      data: { passwordHash: await hashPassword(PASSWORD) },
    });

    const login = await native(api().post("/api/v1/auth/login")).send({
      email: s.email,
      password: PASSWORD,
    });
    expect(login.status).toBe(200);
    expect(login.headers["access-control-allow-origin"]).toBe(
      "https://localhost",
    );
    expect(login.headers["set-cookie"] ?? []).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^aura_rt=/)]),
    );
    const first = login.body.data.refreshToken;
    expect(first).toMatch(/^[\w-]{20,}$/);

    const r1 = await native(api().post("/api/v1/auth/refresh")).send({
      refreshToken: first,
    });
    expect(r1.status).toBe(200);
    const second = r1.body.data.refreshToken;
    expect(second).not.toBe(first);
    expect(r1.body.data.accessToken).toBeTruthy();

    // Using the old token again = theft signal: the whole session is revoked
    expect(
      (
        await native(api().post("/api/v1/auth/refresh")).send({
          refreshToken: first,
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await native(api().post("/api/v1/auth/refresh")).send({
          refreshToken: second,
        })
      ).status,
    ).toBe(401);
  });

  it("logout revokes the body token", async () => {
    const s = await registerSalon("Native Logout");
    await prisma.user.update({
      where: { email: s.email },
      data: { passwordHash: await hashPassword(PASSWORD) },
    });
    const t = (
      await native(api().post("/api/v1/auth/login")).send({
        email: s.email,
        password: PASSWORD,
      })
    ).body.data.refreshToken;
    expect(
      (
        await native(api().post("/api/v1/auth/logout")).send({
          refreshToken: t,
        })
      ).status,
    ).toBe(204);
    expect(
      (
        await native(api().post("/api/v1/auth/refresh")).send({
          refreshToken: t,
        })
      ).status,
    ).toBe(401);
  });

  it("a browser request never accepts a token from the body", async () => {
    const s = await registerSalon("Browser Body");
    await prisma.user.update({
      where: { email: s.email },
      data: { passwordHash: await hashPassword(PASSWORD) },
    });
    const t = (
      await native(api().post("/api/v1/auth/login")).send({
        email: s.email,
        password: PASSWORD,
      })
    ).body.data.refreshToken;
    const r = await api()
      .post("/api/v1/auth/refresh")
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ refreshToken: t });
    expect(r.status).toBe(401);
  });
});
