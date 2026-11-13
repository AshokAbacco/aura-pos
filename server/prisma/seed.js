/**
 * DEVELOPMENT SEED — refuses to run in production.
 *  - SaaS plans (illustrative prices; set real ones in the Platform Admin before launch)
 *  - a platform admin (credentials from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
 *  - demo tenant "Aura Luxe Salon & Spa" carrying the reference prototype's sample data
 *    (services, products, plans, staff, clients, appointments, expenses) — see docs/01-source-audit.md §7.
 * Idempotent: re-running skips existing records.
 */
import "dotenv/config";
import { prisma } from "../src/core/database/prisma.js";
import { hashPassword } from "../src/features/auth/auth.sessions.js";
import { addMonthsClamped } from "../src/features/subscription/subscription.entitlements.js";
import { zonedToUtc, zonedDateString } from "../src/core/utils/time.js";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed development data in production.");
  process.exit(1);
}

// Public plans (keep in step with prisma/migrations/20261106000000_plan_pricing, which updates existing databases).
// Feature order = order of the ticks on the pricing cards.
const PLANS = [
  {
    code: "trial",
    name: "Free Trial",
    interval: "MONTHLY",
    price: "0.00",
    trialDays: 14,
    graceDays: 0,
    maxStaff: 5,
    maxBranches: 1,
    features: ["pos", "appointments", "inventory", "reports"],
    isPublic: false,
    sortOrder: 0,
    description: "14 days, full Starter features, no card required.",
  },
  {
    code: "starter-monthly",
    name: "Starter",
    interval: "MONTHLY",
    price: "500.00",
    graceDays: 3,
    maxStaff: 5,
    maxBranches: 1,
    features: ["pos", "appointments", "inventory", "reports", "app_listing"],
    sortOrder: 1,
    description: "Single-branch salon essentials.",
  },
  {
    code: "pro-monthly",
    name: "Professional",
    interval: "MONTHLY",
    price: "799.00",
    graceDays: 5,
    maxStaff: 15,
    maxBranches: 5,
    features: [
      "pos",
      "appointments",
      "inventory",
      "payroll",
      "reports",
      "app_listing",
      "multibranch",
    ],
    sortOrder: 2,
    description: "Payroll, advanced reports and reminders.",
  },
  {
    code: "pro-annual",
    name: "Professional (Annual)",
    interval: "ANNUAL",
    price: "24990.00",
    graceDays: 7,
    maxStaff: 15,
    maxBranches: 1,
    features: [
      "pos",
      "appointments",
      "inventory",
      "payroll",
      "reports",
      "reports.advanced",
      "notifications",
    ],
    isActive: false,
    isPublic: false,
    sortOrder: 3,
    description: "Retired.",
  },
  {
    code: "business-monthly",
    name: "Customize",
    interval: "MONTHLY",
    price: "1500.00",
    graceDays: 7,
    maxStaff: 100,
    maxBranches: 10,
    features: [
      "pos",
      "appointments",
      "inventory",
      "payroll",
      "reports",
      "reports.advanced",
      "notifications",
      "multibranch",
    ],
    sortOrder: 4,
    description: "5-page website & own brand app.",
  },
];

async function main() {
  for (const p of PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log(`plans: ${PLANS.length}`);

  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL || "admin@aura.local"
  ).toLowerCase();
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD || "ChangeMe-Admin-2026!";
  // Only when there is no platform admin at all: once you have changed it (npm run admin:set),
  // re-running the seed must not bring back the demo login with its well-known password.
  if (!(await prisma.platformAdmin.count())) {
    await prisma.platformAdmin.create({
      data: {
        email: adminEmail,
        name: "Platform Admin",
        passwordHash: await hashPassword(adminPassword),
      },
    });
    console.log(`platform admin: ${adminEmail}`);
  }

  const ownerEmail = "owner@auraluxe.demo";
  if (await prisma.user.findUnique({ where: { email: ownerEmail } })) {
    console.log("demo tenant already present — done");
    return;
  }
  const tz = "Asia/Kolkata";
  const pro = await prisma.subscriptionPlan.findUnique({
    where: { code: "pro-monthly" },
  });
  const now = new Date();

  await prisma.$transaction(
    async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug: "aura-luxe-demo",
          legalName: "Aura Luxe Salon & Spa",
          displayName: "Aura Luxe Salon & Spa",
          tagline: "Premium Hair, Skin & Wellness Sanctuary",
          gstin: "29AABCU9603R1ZM",
          stateCode: "29",
          timezone: tz,
        },
      });
      const T = tenant.id;
      const branch = await tx.branch.create({
        data: {
          tenantId: T,
          name: "Indiranagar Flagship",
          code: "IND",
          stateCode: "29",
          phone: "+91 80 4123 9876",
          upiId: "auraluxe@okhdfcbank",
          address:
            "#482, 100ft Road, 12th Main, Indiranagar, Bengaluru, Karnataka 560038",
          receiptFooter:
            "Please retain this receipt for tax & warranty purposes.",
        },
      });
      const chairs = {};
      const FLOOR_PLAN = [
        ["Chair 1", "CHAIR", "Ground floor"],
        ["Chair 2", "CHAIR", "Ground floor"],
        ["Chair 3", "CHAIR", "Ground floor"],
        ["Chair 4", "CHAIR", "Ground floor"],
        ["Nail Station 1", "STATION", "Ground floor"],
        ["Spa Room 1", "ROOM", "First floor"],
        ["Spa Room 2", "ROOM", "First floor"],
        ["Facial Room", "ROOM", "First floor"],
      ];
      for (const [i, [name, kind, floor]] of FLOOR_PLAN.entries())
        chairs[name] = await tx.resource.create({
          data: {
            tenantId: T,
            branchId: branch.id,
            name,
            kind,
            floor,
            sortOrder: i,
          },
        });

      const sub = await tx.subscription.create({
        data: {
          tenantId: T,
          planId: pro.id,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: addMonthsClamped(now, 1),
        },
      });
      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: sub.id,
          type: "ACTIVATED",
          toStatus: "ACTIVE",
          actor: "system",
          detail: { seed: true },
        },
      });

      const owner = await tx.user.create({
        data: {
          tenantId: T,
          email: ownerEmail,
          name: "Demo Owner",
          role: "OWNER",
          allBranches: true,
          passwordHash: await hashPassword("DemoOwner-2026!"),
          emailVerifiedAt: now,
          termsAcceptedAt: now,
        },
      });
      await tx.user.create({
        data: {
          tenantId: T,
          email: "frontdesk@auraluxe.demo",
          name: "Front Desk",
          role: "RECEPTIONIST",
          branchIds: [branch.id],
          passwordHash: await hashPassword("DemoDesk-2026!"),
          emailVerifiedAt: now,
          termsAcceptedAt: now,
        },
      });

      const cats = {};
      for (const [i, n] of ["Hair", "Skin & Spa", "Nails", "Retail"].entries())
        cats[n] = await tx.category.create({
          data: { tenantId: T, name: n, sortOrder: i },
        });

      const S = (name, cat, price, dur, icon) => ({
        tenantId: T,
        categoryId: cats[cat].id,
        type: "SERVICE",
        name,
        price,
        durationMin: dur,
        icon,
        taxRate: 18,
        sacHsn: "999721",
      });
      const services = [
        S("Creative Haircut & Styling", "Hair", "950", 45, "scissors"),
        S("Moroccanoil Deep Spa Therapy", "Hair", "2400", 60, "sparkles"),
        S("Balayage / Ombre Highlighting", "Hair", "4800", 150, "sparkles"),
        S("Hydra-Dew Glow Facial", "Skin & Spa", "2800", 75, "spa"),
        S(
          "Aroma De-Stress Full Body Massage",
          "Skin & Spa",
          "3200",
          60,
          "hands",
        ),
        S("Luxury Gel Spa Pedicure", "Nails", "1400", 50, "hand-sparkles"),
        S(
          "Acrylic Nail Extensions (Set)",
          "Nails",
          "2200",
          90,
          "hand-sparkles",
        ),
      ];
      const svc = {};
      for (const s of services)
        svc[s.name] = await tx.catalogItem.create({ data: s });
      const products = [
        {
          name: "L'Oréal Absolut Repair Shampoo (300ml)",
          price: "1150",
          cost: "690",
          stock: 18,
          sku: "LOR-AR-300",
        },
        {
          name: "Moroccanoil Treatment Oil (100ml)",
          price: "3150",
          cost: "1980",
          stock: 9,
          sku: "MO-TO-100",
        },
        {
          name: "Dermalogica Daily Microfoliant",
          price: "1950",
          cost: "1150",
          stock: 12,
          sku: "DRM-DMF-74",
        },
      ];
      for (const p of products) {
        const item = await tx.catalogItem.create({
          data: {
            tenantId: T,
            categoryId: cats.Retail.id,
            type: "PRODUCT",
            name: p.name,
            price: p.price,
            cost: p.cost,
            sku: p.sku,
            taxRate: 18,
            sacHsn: "33051090",
            minStock: 5,
            icon: "bottle",
          },
        });
        await tx.stockLevel.create({
          data: {
            tenantId: T,
            branchId: branch.id,
            itemId: item.id,
            quantity: p.stock,
          },
        });
        await tx.stockMovement.create({
          data: {
            tenantId: T,
            branchId: branch.id,
            itemId: item.id,
            type: "OPENING",
            quantity: p.stock,
            balanceAfter: p.stock,
            unitCost: p.cost,
            note: "Opening stock (seed)",
            actorUserId: owner.id,
          },
        });
      }

      const plans = {};
      for (const p of [
        {
          name: "Silver Club",
          price: "1999",
          discountPercent: 10,
          bonusWalletCredit: "300",
          validityMonths: 6,
          perks: "10% off all haircuts and manicures",
        },
        {
          name: "Gold VIP",
          price: "3999",
          discountPercent: 15,
          bonusWalletCredit: "800",
          validityMonths: 12,
          perks: "15% off services + free scalp check + 1 guest pass",
        },
        {
          name: "Platinum Royale",
          price: "7999",
          discountPercent: 20,
          bonusWalletCredit: "2000",
          validityMonths: 12,
          perks: "20% off all services & retail + priority chair booking",
          appliesToProducts: true,
        },
      ])
        plans[p.name] = await tx.membershipPlan.create({
          data: { tenantId: T, ...p },
        });

      const staff = {};
      for (const s of [
        {
          name: "Vikram Mehta",
          designation: "Master Stylist",
          phone: "+91 98860 44321",
          baseSalary: "30000",
          serviceCommission: 35,
          aadhaarLast4: "3456",
          panMasked: "ABCDE••••K",
          bankName: "HDFC Bank",
          bankAccountLast4: "5123",
          ifsc: "HDFC0001043",
        },
        {
          name: "Ananya Roy",
          designation: "Senior Colorist",
          phone: "+91 97410 88765",
          baseSalary: "26000",
          serviceCommission: 30,
          aadhaarLast4: "8765",
          panMasked: "BQZPR••••L",
          bankName: "ICICI Bank",
          bankAccountLast4: "7890",
          ifsc: "ICIC0000234",
        },
        {
          name: "Deepak Rao",
          designation: "Spa Therapist",
          phone: "+91 99011 22345",
          baseSalary: "22000",
          serviceCommission: 25,
          aadhaarLast4: "7890",
          panMasked: "DKLPR••••M",
          bankName: "State Bank of India",
          bankAccountLast4: "2903",
          ifsc: "SBIN0004512",
        },
        {
          name: "Sneha Patel",
          designation: "Nail Artist",
          phone: "+91 98450 67890",
          baseSalary: "20000",
          serviceCommission: 30,
          aadhaarLast4: "5432",
          panMasked: "APQSP••••N",
          bankName: "Axis Bank",
          bankAccountLast4: "7561",
          ifsc: "UTIB0000845",
        },
      ])
        staff[s.name] = await tx.staffProfile.create({
          data: {
            tenantId: T,
            branchId: branch.id,
            whatsapp: s.phone,
            productCommission: 10,
            salaryFrequency: "MONTHLY",
            joinedOn: new Date("2026-01-01"),
            ...s,
          },
        });

      const clients = {};
      for (const c of [
        {
          name: "Pooja Sharma",
          phone: "+919886012345",
          plan: "Gold VIP",
          wallet: "2400",
          visits: 8,
          colorFormula: "Majirel 5.3 (Golden Brown) + 20 Vol.",
          allergies: "Scalp sensitive to ammonia",
          patch: ["PASSED", "2026-06-15"],
        },
        {
          name: "Rohan Mehra",
          phone: "+919916054321",
          plan: "Silver Club",
          wallet: "600",
          visits: 3,
          notes: "Oily T-zone. Prefers tea tree and charcoal facials.",
        },
        {
          name: "Natasha Kapoor",
          phone: "+919740098765",
          plan: "Platinum Royale",
          wallet: "5500",
          visits: 14,
          colorFormula:
            "Balayage Olaplex Step 1 & 2. Dialight 9.02 Toner on ends.",
          patch: ["PASSED", "2026-08-10"],
        },
        {
          name: "Rahul Verma",
          phone: "+919845011223",
          plan: null,
          wallet: "0",
          visits: 1,
          notes: "Fade #1 on sides, textured crop on top.",
        },
      ]) {
        const cust = await tx.customer.create({
          data: {
            tenantId: T,
            name: c.name,
            phone: c.phone,
            colorFormula: c.colorFormula,
            allergies: c.allergies,
            notes: c.notes,
            visitCount: c.visits,
            walletBalance: c.wallet,
          },
        });
        if (c.wallet !== "0")
          await tx.walletEntry.create({
            data: {
              tenantId: T,
              customerId: cust.id,
              type: "ADJUSTMENT",
              amount: c.wallet,
              balanceAfter: c.wallet,
              reason: "Opening balance migrated from previous system",
              actorUserId: owner.id,
            },
          });
        if (c.plan)
          await tx.customerMembership.create({
            data: {
              tenantId: T,
              customerId: cust.id,
              planId: plans[c.plan].id,
              startsAt: new Date(now.getTime() - 30 * 86400000),
              endsAt: addMonthsClamped(now, plans[c.plan].validityMonths - 1),
            },
          });
        if (c.patch)
          await tx.patchTest.create({
            data: {
              tenantId: T,
              customerId: cust.id,
              product: "Colour (allergy alert test)",
              result: c.patch[0],
              testedAt: new Date(c.patch[1]),
              actorUserId: owner.id,
            },
          });
        clients[c.name] = cust;
      }

      // Tomorrow's appointments (prototype: 11:00, 11:30, 12:15) so they are bookable/billable in demos.
      const tomorrow = zonedDateString(new Date(now.getTime() + 86400000), tz);
      for (const a of [
        {
          c: "Natasha Kapoor",
          s: "Ananya Roy",
          svc: "Balayage / Ombre Highlighting",
          t: "11:00",
          chair: "Chair 1",
          status: "CONFIRMED",
        },
        {
          c: "Rohan Mehra",
          s: "Deepak Rao",
          svc: "Hydra-Dew Glow Facial",
          t: "11:30",
          chair: "Spa Room 2",
          status: "BOOKED",
        },
        {
          c: "Pooja Sharma",
          s: "Vikram Mehta",
          svc: "Moroccanoil Deep Spa Therapy",
          t: "12:15",
          chair: "Chair 4",
          status: "BOOKED",
        },
      ]) {
        const startsAt = zonedToUtc(tomorrow, a.t, tz);
        await tx.appointment.create({
          data: {
            tenantId: T,
            branchId: branch.id,
            customerId: clients[a.c].id,
            staffId: staff[a.s].id,
            resourceId: chairs[a.chair].id,
            serviceId: svc[a.svc].id,
            serviceName: a.svc,
            startsAt,
            endsAt: new Date(
              startsAt.getTime() + svc[a.svc].durationMin * 60000,
            ),
            status: a.status,
          },
        });
      }

      const month = zonedDateString(now, tz).slice(0, 7);
      for (const [day, title, category, amount, mode, notes] of [
        [
          "01",
          "Premises Rent Indiranagar",
          "RENT",
          "35000",
          "BANK_TRANSFER",
          "Monthly lease rental",
        ],
        [
          "05",
          "BESCOM Power & AC Electricity",
          "UTILITIES",
          "6850",
          "UPI",
          "Meter #48293",
        ],
        [
          "08",
          "L'Oréal Backbar Developers & Bleach",
          "SUPPLIES",
          "8400",
          "BANK_TRANSFER",
          "Bulk chemical stock",
        ],
        [
          "12",
          "Clean Linen & Spa Towels Laundry",
          "HOUSEKEEPING",
          "2800",
          "CASH",
          "Weekly 400 towels",
        ],
        [
          "14",
          "Instagram & Local Ads Campaign",
          "MARKETING",
          "3500",
          "CREDIT_CARD",
          "Festive campaign",
        ],
        [
          "15",
          "Coffee Beans & Green Tea Pantry",
          "PANTRY",
          "1250",
          "UPI",
          "Client refreshments",
        ],
      ])
        await tx.expense.create({
          data: {
            tenantId: T,
            branchId: branch.id,
            title,
            category,
            amount,
            spentOn: new Date(`${month}-${day}T00:00:00Z`),
            paymentMode: mode,
            notes,
            createdBy: owner.id,
          },
        });

      for (const c of [
        {
          code: "FIRST10",
          description: "First visit 10% off",
          kind: "PERCENT",
          value: "10",
          firstVisitOnly: true,
        },
        {
          code: "FESTIVE500",
          description: "Flat ₹500 off on bills over ₹2,000",
          kind: "FLAT",
          value: "500",
          minSubtotal: "2000",
        },
      ])
        await tx.coupon.create({ data: { tenantId: T, ...c } });
    },
    { timeout: 60000 },
  );

  console.log(
    "demo tenant: owner@auraluxe.demo / DemoOwner-2026!  ·  frontdesk@auraluxe.demo / DemoDesk-2026!",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
