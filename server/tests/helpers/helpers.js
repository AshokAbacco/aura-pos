import http from "node:http";
import crypto from "node:crypto";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/prisma.js";
import { outbox } from "../../src/core/mail/mailer.js";
import { hashPassword } from "../../src/features/auth/auth.sessions.js";
import { signForTest } from "../../src/integrations/razorpay/razorpay.signature.js";

export const app = createApp();
export { prisma, outbox };
const api = () => request(app);

export async function resetDb() {
  const tables =
    await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await prisma.$executeRawUnsafe(
    `TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
  outbox.length = 0;
}

export async function seedPlans() {
  const base = { currency: "INR", isActive: true, isPublic: true };
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        ...base,
        code: "trial",
        name: "Trial",
        interval: "MONTHLY",
        price: "0",
        trialDays: 14,
        graceDays: 0,
        maxStaff: 5,
        maxBranches: 1,
        features: ["pos", "appointments", "inventory", "reports"],
        isPublic: false,
      },
      {
        ...base,
        code: "starter",
        name: "Starter",
        interval: "MONTHLY",
        price: "999.00",
        graceDays: 3,
        maxStaff: 3,
        maxBranches: 1,
        features: ["pos", "appointments", "inventory", "reports"],
      },
      {
        ...base,
        code: "business",
        name: "Business",
        interval: "MONTHLY",
        price: "5999.00",
        graceDays: 7,
        maxStaff: 50,
        maxBranches: 5,
        features: [
          "pos",
          "appointments",
          "inventory",
          "reports",
          "multibranch",
          "payroll",
        ],
      },
    ],
  });
  return Object.fromEntries(
    (await prisma.subscriptionPlan.findMany()).map((p) => [p.code, p]),
  );
}

let counter = 0;
/** Register a salon via the real API. Returns an authenticated helper bound to the owner. */
export async function registerSalon(
  name = `Salon ${++counter}`,
  { verify = true } = {},
) {
  const email = `owner${counter}-${crypto.randomBytes(3).toString("hex")}@example.test`;
  const res = await api()
    .post("/api/v1/auth/register")
    .send({
      name: "Owner Person",
      email,
      password: "correct-horse-battery",
      phone: "+919800000000",
      salonName: name,
      stateCode: "29",
      acceptTerms: true,
    });
  if (res.status !== 201)
    throw new Error(
      `register failed ${res.status} ${JSON.stringify(res.body)}`,
    );
  const tenantId = res.body.data.tenant.id;
  if (verify)
    await prisma.user.updateMany({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });
  const branch = await prisma.branch.findFirst({ where: { tenantId } });
  return {
    ...client(res.body.data.accessToken),
    email,
    tenantId,
    branchId: branch.id,
    cookies: res.headers["set-cookie"],
  };
}

/** Thin wrapper adding the bearer token to supertest calls. */
export function client(token) {
  const withAuth = (r) => r.set("Authorization", `Bearer ${token}`);
  return {
    token,
    get: (url) => withAuth(api().get(url)),
    post: (url, body) => withAuth(api().post(url)).send(body ?? {}),
    patch: (url, body) => withAuth(api().patch(url)).send(body ?? {}),
    put: (url, body) => withAuth(api().put(url)).send(body ?? {}),
    del: (url) => withAuth(api().delete(url)),
    checkout: (body, key = crypto.randomUUID()) =>
      withAuth(api().post("/api/v1/pos/checkout"))
        .set("Idempotency-Key", key)
        .send(body),
  };
}

/** Create a tenant user with a role and return an authenticated client. */
export async function addUser(tenantId, role, extra = {}) {
  const email = `${role.toLowerCase()}-${crypto.randomBytes(4).toString("hex")}@example.test`;
  await prisma.user.create({
    data: {
      tenantId,
      email,
      name: role,
      role,
      passwordHash: await hashPassword("correct-horse-battery"),
      emailVerifiedAt: new Date(),
      ...extra,
    },
  });
  const res = await api()
    .post("/api/v1/auth/login")
    .send({ email, password: "correct-horse-battery" });
  if (res.status !== 200) throw new Error(`login failed ${res.status}`);
  return client(res.body.data.accessToken);
}

/** Basic catalogue/staff/customer fixture through the API. */
export async function buildShop(owner) {
  const cats = (await owner.get("/api/v1/catalog/categories")).body.data;
  const cat = (n) => cats.find((c) => c.name === n).id;
  const mk = async (body) => {
    const r = await owner.post("/api/v1/catalog/items", body);
    if (r.status !== 201)
      throw new Error(`item ${r.status} ${JSON.stringify(r.body)}`);
    return r.body.data;
  };
  const haircut = await mk({
    type: "SERVICE",
    categoryId: cat("Hair"),
    name: "Haircut",
    price: 950,
    taxRate: 18,
    durationMin: 45,
  });
  const spa = await mk({
    type: "SERVICE",
    categoryId: cat("Hair"),
    name: "Hair Spa",
    price: 2400,
    taxRate: 18,
    durationMin: 60,
  });
  const shampoo = await mk({
    type: "PRODUCT",
    categoryId: cat("Retail"),
    name: "Shampoo",
    price: 1150,
    taxRate: 18,
    openingStock: 5,
    minStock: 2,
  });
  const staffRes = await owner.post("/api/v1/staff", {
    name: "Vikram",
    designation: "Stylist",
    phone: "+919886044321",
    baseSalary: 30000,
    serviceCommission: 35,
    productCommission: 10,
  });
  if (staffRes.status !== 201)
    throw new Error(
      `staff ${staffRes.status} ${JSON.stringify(staffRes.body)}`,
    );
  const custRes = await owner.post("/api/v1/clients", {
    name: "Pooja",
    phone: "+919886012345",
  });
  const plan = (
    await owner.post("/api/v1/memberships/plans", {
      name: "Gold",
      price: 3999,
      discountPercent: 15,
      bonusWalletCredit: 800,
      validityMonths: 12,
    })
  ).body.data;
  return {
    haircut,
    spa,
    shampoo,
    staff: staffRes.body.data,
    customer: custRes.body.data,
    plan,
  };
}

export async function setSubscription(
  tenantId,
  planCode,
  { status = "ACTIVE", endsInDays = 30, cancelAtPeriodEnd = false } = {},
) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { code: planCode },
  });
  const end = new Date(Date.now() + endsInDays * 86400000);
  await prisma.subscription.deleteMany({
    where: { tenantId, events: { none: {} } },
  });
  const existing = await prisma.subscription.findFirst({ where: { tenantId } });
  const data = {
    planId: plan.id,
    status,
    currentPeriodStart: new Date(end.getTime() - 30 * 86400000),
    currentPeriodEnd: end,
    cancelAtPeriodEnd,
  };
  return existing
    ? prisma.subscription.update({ where: { id: existing.id }, data })
    : prisma.subscription.create({ data: { tenantId, ...data } });
}

// ── Razorpay stub (Orders API) ──────────────────────────────────
export function startRazorpayStub(port = 45991) {
  const orders = new Map();
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      const auth = Buffer.from(
        (req.headers.authorization ?? "").replace("Basic ", ""),
        "base64",
      ).toString();
      if (auth !== "rzp_test_dummykey:rzp_test_dummy_secret") {
        res.writeHead(401);
        return res.end("{}");
      }
      if (req.method === "POST" && req.url === "/v1/orders") {
        const b = JSON.parse(raw);
        const order = {
          id: `order_${crypto.randomBytes(7).toString("hex")}`,
          entity: "order",
          amount: b.amount,
          currency: b.currency,
          receipt: b.receipt,
          notes: b.notes,
          status: "created",
        };
        orders.set(order.id, order);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(order));
      }
      res.writeHead(404);
      res.end("{}");
    });
  });
  return new Promise((resolve) =>
    server.listen(port, "127.0.0.1", () =>
      resolve({ orders, close: () => new Promise((r) => server.close(r)) }),
    ),
  );
}

export const checkoutSignature = (orderId, paymentId) =>
  signForTest(`${orderId}|${paymentId}`, "rzp_test_dummy_secret");
export const webhookSignature = (raw) =>
  signForTest(raw, "whsec_dummy_for_tests");
export { api };
