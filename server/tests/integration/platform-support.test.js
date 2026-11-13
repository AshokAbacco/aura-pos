import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  api,
  prisma,
  resetDb,
  seedPlans,
  registerSalon,
  client,
  setSubscription,
  outbox,
} from "../helpers/helpers.js";
import { hashPassword } from "../../src/features/auth/auth.sessions.js";

let superAdmin;
let support;
let salonA;
let salonB;

async function platformLogin(email, password) {
  const r = await api()
    .post("/api/v1/platform/auth/login")
    .send({ email, password });
  expect(r.status).toBe(200);
  return { ...client(r.body.data.accessToken), profile: r.body.data.admin };
}

beforeAll(async () => {
  await resetDb();
  await seedPlans();
  await prisma.platformAdmin.create({
    data: {
      email: "boss@aura.test",
      name: "Boss",
      role: "SUPER_ADMIN",
      passwordHash: await hashPassword("super-password-123"),
    },
  });
  superAdmin = await platformLogin("boss@aura.test", "super-password-123");
  salonA = await registerSalon("Glow Studio");
  salonB = await registerSalon("Velvet Spa");
  await prisma.user.updateMany({
    where: { email: salonA.email },
    data: { phone: "+91 98450 12345" },
  });
  await prisma.user.updateMany({
    where: { email: salonB.email },
    data: { phone: "9988776655" },
  });
  await setSubscription(salonB.tenantId, "starter", {
    status: "ACTIVE",
    endsInDays: 5,
  });
});

afterAll(async () => {
  await superAdmin.put("/api/v1/platform/settings", { loginMethod: "EMAIL" });
});

describe("platform team and roles", () => {
  it("a super admin adds a support member; support can look but not change money or access", async () => {
    const add = await superAdmin.post("/api/v1/platform/admins", {
      email: "help@aura.test",
      name: "Helpdesk",
      role: "SUPPORT",
      password: "support-password-1",
    });
    expect(add.status).toBe(201);
    support = await platformLogin("help@aura.test", "support-password-1");
    expect(support.profile).toMatchObject({
      role: "SUPPORT",
      name: "Helpdesk",
    });
    expect((await support.get("/api/v1/platform/auth/me")).body.data.role).toBe(
      "SUPPORT",
    );

    expect(
      (await support.get(`/api/v1/platform/tenants/${salonA.tenantId}`)).status,
    ).toBe(200);
    expect(
      (
        await support.post(
          `/api/v1/platform/tenants/${salonA.tenantId}/extend`,
          { days: 5, reason: "Trying as support" },
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await support.post(
          `/api/v1/platform/tenants/${salonA.tenantId}/suspend`,
          { reason: "Trying as support" },
        )
      ).status,
    ).toBe(403);
    expect((await support.get("/api/v1/platform/admins")).status).toBe(403);
    expect(
      (await support.put("/api/v1/platform/settings", { loginMethod: "BOTH" }))
        .status,
    ).toBe(403);
  });

  it("cannot demote or disable the last super admin", async () => {
    const r = await superAdmin.patch(
      `/api/v1/platform/admins/${superAdmin.profile.id}`,
      { role: "SUPPORT" },
    );
    expect(r.status).toBe(403);
  });
});

describe("universal search and salon list", () => {
  it("finds salons, logins by phone digits, customers and invoices from one box", async () => {
    await prisma.customer.create({
      data: {
        tenantId: salonA.tenantId,
        name: "Meera Kapoor",
        phone: "+919811100022",
      },
    });
    const byName = await support.get("/api/v1/platform/search?q=glow");
    expect(byName.body.data.tenants.map((t) => t.displayName)).toContain(
      "Glow Studio",
    );
    const byPhone = await support.get(
      "/api/v1/platform/search?q=98450%2012345",
    );
    expect(
      byPhone.body.data.users.some(
        (u) => u.tenant.displayName === "Glow Studio",
      ),
    ).toBe(true);
    const customer = await support.get("/api/v1/platform/search?q=meera");
    expect(customer.body.data.customers[0]).toMatchObject({
      name: "Meera Kapoor",
      tenant: { displayName: "Glow Studio" },
    });
  });

  it("filters by plan state, expiry window and sorts by expiry", async () => {
    const expiring = await support.get(
      "/api/v1/platform/salons?expiresWithin=7&sort=expiry",
    );
    expect(expiring.body.data.map((t) => t.displayName)).toEqual([
      "Velvet Spa",
    ]);
    expect(expiring.body.data[0]).toMatchObject({
      plan: "Starter",
      effectiveState: "ACTIVE",
    });
    expect(expiring.body.data[0].daysLeft).toBeLessThanOrEqual(5);
    const trial = await support.get("/api/v1/platform/salons?state=TRIAL");
    expect(trial.body.data.map((t) => t.displayName)).toContain("Glow Studio");
    expect(trial.body.data.map((t) => t.displayName)).not.toContain(
      "Velvet Spa",
    );
  });
});

describe("salon detail: people, activity, notes and follow-ups", () => {
  it("shows one person in full (without password hash) and can sign them out of all devices", async () => {
    const owner = await prisma.user.findFirst({
      where: { tenantId: salonA.tenantId },
    });
    const r = await support.get(
      `/api/v1/platform/tenants/${salonA.tenantId}/users/${owner.id}`,
    );
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      email: salonA.email,
      role: "OWNER",
      hasPassword: true,
    });
    expect(r.body.data.passwordHash).toBeUndefined();
    expect(r.body.data.sessions.length).toBeGreaterThan(0);
    expect(
      (
        await support.get(
          `/api/v1/platform/tenants/${salonB.tenantId}/users/${owner.id}`,
        )
      ).status,
    ).toBe(404);

    const out = await support.post(
      `/api/v1/platform/tenants/${salonA.tenantId}/users/${owner.id}/sign-out`,
      { reason: "Lost phone reported" },
    );
    expect(out.status).toBe(200);
    expect((await salonA.get("/api/v1/auth/me")).status).toBe(401);
    const act = await support.get(
      `/api/v1/platform/tenants/${salonA.tenantId}/activity`,
    );
    expect(
      act.body.data.some((a) => a.action === "platform.user_signed_out"),
    ).toBe(true);
  });

  it("keeps notes with follow-ups and lists them on the renewals desk", async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const n = await support.post(
      `/api/v1/platform/tenants/${salonB.tenantId}/notes`,
      {
        kind: "CALL",
        body: "Owner will renew after Diwali",
        followUpAt: tomorrow,
      },
    );
    expect(n.status).toBe(201);
    expect(n.body.data.author.name).toBe("Helpdesk");
    const desk = await support.get("/api/v1/platform/follow-ups?days=14");
    expect(desk.body.data.expiring.map((r) => r.displayName)).toContain(
      "Velvet Spa",
    );
    expect(desk.body.data.followUps[0]).toMatchObject({
      body: "Owner will renew after Diwali",
      tenant: { displayName: "Velvet Spa" },
    });
    expect(
      (await support.get("/api/v1/platform/salons?followUp=due")).body.data.map(
        (t) => t.displayName,
      ),
    ).toEqual(["Velvet Spa"]);
    const done = await support.patch(
      `/api/v1/platform/notes/${n.body.data.id}`,
      { status: "DONE" },
    );
    expect(done.body.data.status).toBe("DONE");
    expect(
      (await support.get("/api/v1/platform/follow-ups")).body.data.followUps,
    ).toHaveLength(0);
  });
});

describe("messages to salons", () => {
  it("sends a renewal reminder to expiring salons (in-app + email) and the salon reads it", async () => {
    outbox.length = 0;
    const r = await support.post("/api/v1/platform/messages", {
      audience: "expiring",
      expiresWithin: 7,
      kind: "RENEWAL",
      title: "Your plan ends soon",
      body: "Renew to keep billing without a break.",
      link: "/app/subscription",
      email: true,
    });
    expect(r.status).toBe(201);
    expect(r.body.data).toMatchObject({ recipients: 1, emailed: 1 });
    expect(outbox.at(-1)).toMatchObject({ subject: "Your plan ends soon" });

    const ownerB = await prisma.user.findFirst({
      where: { tenantId: salonB.tenantId },
    });
    await prisma.user.update({
      where: { id: ownerB.id },
      data: { passwordHash: await hashPassword("correct-horse-battery") },
    });
    const login = await api()
      .post("/api/v1/auth/login")
      .send({ email: ownerB.email, password: "correct-horse-battery" });
    const b = client(login.body.data.accessToken);
    const inbox = await b.get("/api/v1/inbox");
    expect(inbox.body.data).toMatchObject({
      unread: 1,
      rows: [{ title: "Your plan ends soon", kind: "RENEWAL" }],
    });
    await b.post("/api/v1/inbox/all/read");
    expect((await b.get("/api/v1/inbox")).body.data.unread).toBe(0);

    const sent = await support.get("/api/v1/platform/messages");
    expect(sent.body.data[0]).toMatchObject({
      title: "Your plan ends soon",
      recipients: 1,
      read: 1,
      emailed: 1,
      by: "Helpdesk",
    });
  });

  it("new plan alert to everyone; a salon never sees another salon's messages", async () => {
    const r = await superAdmin.post("/api/v1/platform/messages", {
      audience: "all",
      kind: "NEW_PLAN",
      title: "New Annual plan",
      body: "Save 2 months with annual billing.",
    });
    expect(r.body.data.recipients).toBe(2);
    const a = await superAdmin.post("/api/v1/platform/messages", {
      audience: "selected",
      tenantIds: [salonA.tenantId],
      kind: "CUSTOM",
      title: "Only for Glow",
      body: "Private note for Glow.",
    });
    expect(a.body.data.recipients).toBe(1);
    const ownerB = await prisma.user.findFirst({
      where: { tenantId: salonB.tenantId },
    });
    const login = await api()
      .post("/api/v1/auth/login")
      .send({ email: ownerB.email, password: "correct-horse-battery" });
    const titles = (
      await client(login.body.data.accessToken).get("/api/v1/inbox")
    ).body.data.rows.map((m) => m.title);
    expect(titles).toContain("New Annual plan");
    expect(titles).not.toContain("Only for Glow");
    expect(
      (
        await superAdmin.post("/api/v1/platform/messages", {
          audience: "selected",
          kind: "CUSTOM",
          title: "x x x",
          body: "y y y",
        })
      ).status,
    ).toBe(400);
  });
});

describe("sign-in method setting", () => {
  it("EMAIL (default): phone sign-in is refused with a clear message", async () => {
    expect(
      (await api().get("/api/v1/public/config")).body.data.loginMethod,
    ).toBe("EMAIL");
    const r = await api()
      .post("/api/v1/auth/login")
      .send({ identifier: "9988776655", password: "correct-horse-battery" });
    expect(r.status).toBe(401);
    expect(r.body.error.message).toMatch(/email/i);
  });

  it("BOTH: email or mobile number (any format) work; PHONE: email is refused", async () => {
    const s = await superAdmin.put("/api/v1/platform/settings", {
      loginMethod: "BOTH",
    });
    expect(s.body.data).toMatchObject({ loginMethod: "BOTH" });
    expect(s.body.data).toHaveProperty("usersWithoutPhone");
    expect(
      (await api().get("/api/v1/public/config")).body.data.loginMethod,
    ).toBe("BOTH");
    for (const id of ["9988776655", "+91 99887 76655", "099887-76655"]) {
      const r = await api()
        .post("/api/v1/auth/login")
        .send({ identifier: id, password: "correct-horse-battery" });
      expect(r.status, id).toBe(200);
    }
    const ownerB = await prisma.user.findFirst({
      where: { tenantId: salonB.tenantId },
    });
    expect(
      (
        await api()
          .post("/api/v1/auth/login")
          .send({ identifier: ownerB.email, password: "correct-horse-battery" })
      ).status,
    ).toBe(200);
    expect(
      (
        await api()
          .post("/api/v1/auth/login")
          .send({ identifier: "9988776655", password: "wrong-password" })
      ).body.error.message,
    ).toMatch(/mobile number or password/);

    await superAdmin.put("/api/v1/platform/settings", { loginMethod: "PHONE" });
    const viaEmail = await api()
      .post("/api/v1/auth/login")
      .send({ identifier: ownerB.email, password: "correct-horse-battery" });
    expect(viaEmail.status).toBe(401);
    expect(viaEmail.body.error.message).toMatch(/mobile number/);
  });

  it("a phone shared by two accounts: the password picks the account; same password on both asks for email", async () => {
    await superAdmin.put("/api/v1/platform/settings", { loginMethod: "BOTH" });
    await prisma.user.updateMany({
      where: { email: salonA.email },
      data: {
        phone: "9988776655",
        passwordHash: await hashPassword("another-password-1"),
      },
    });
    const a = await api()
      .post("/api/v1/auth/login?include=me")
      .send({ identifier: "9988776655", password: "another-password-1" });
    expect(a.status).toBe(200);
    expect(a.body.data.me.tenant.displayName).toBe("Glow Studio");
    const b = await api()
      .post("/api/v1/auth/login?include=me")
      .send({ identifier: "9988776655", password: "correct-horse-battery" });
    expect(b.body.data.me.tenant.displayName).toBe("Velvet Spa");

    await prisma.user.updateMany({
      where: { email: salonA.email },
      data: { passwordHash: await hashPassword("correct-horse-battery") },
    });
    const both = await api()
      .post("/api/v1/auth/login")
      .send({ identifier: "9988776655", password: "correct-horse-battery" });
    expect(both.status).toBe(401);
    expect(both.body.error.message).toMatch(/more than one account/);
    expect(
      (await superAdmin.get("/api/v1/platform/settings")).body.data
        .sharedPhones,
    ).toBeGreaterThanOrEqual(1);
  });
});

describe("your own mobile number", () => {
  it("an owner sets their own mobile (PATCH /auth/me) and can then sign in with it", async () => {
    await superAdmin.put("/api/v1/platform/settings", { loginMethod: "BOTH" });
    const s = await registerSalon("Own Phone Salon");
    await prisma.user.updateMany({
      where: { email: s.email },
      data: {
        phone: null,
        passwordHash: await hashPassword("own-phone-pass-1"),
      },
    });
    expect(
      (
        await api()
          .post("/api/v1/auth/login")
          .send({ identifier: "9090909090", password: "own-phone-pass-1" })
      ).status,
    ).toBe(401);
    const r = await s.patch("/api/v1/auth/me", { phone: "+91 90909 09090" });
    expect(r.status).toBe(200);
    expect(r.body.data.user.phone).toBe("+91 90909 09090");
    expect(
      (
        await api()
          .post("/api/v1/auth/login")
          .send({ identifier: "9090909090", password: "own-phone-pass-1" })
      ).status,
    ).toBe(200);
    expect((await s.patch("/api/v1/auth/me", { phone: "abc" })).status).toBe(
      400,
    );
  });
});
