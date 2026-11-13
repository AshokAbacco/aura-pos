/**
 * Why can't someone sign in with their mobile number?  From server/:
 *
 *   npm run check:phone -- 9876543210
 *
 * Prints the sign-in setting and every account using that number (salon, role, active, password set).
 * Uses DATABASE_URL from server/.env.
 */
import "dotenv/config";
import { prisma } from "../src/core/database/prisma.js";

const input = process.argv[2] ?? "";
const last10 = input.replace(/\D/g, "").slice(-10);
try {
  const setting = await prisma.platformSetting
    .findUnique({ where: { key: "loginMethod" } })
    .catch(() => null);
  const method = setting?.value ?? "EMAIL (default)";
  console.log(`Sign-in method: ${method}`);
  if (String(method).startsWith("EMAIL"))
    console.log(
      '  → Mobile sign-in is OFF. Platform admin → Settings → "Email or mobile number".',
    );
  if (last10.length !== 10) {
    console.log(
      "\nGive a 10-digit mobile number: npm run check:phone -- 9876543210",
    );
    process.exit(1);
  }
  const rows =
    await prisma.$queryRaw`SELECT u.email, u.phone, u.role, u."isActive", (u."passwordHash" IS NOT NULL) AS "hasPassword", t."displayName", t.status
    FROM "User" u JOIN "Tenant" t ON t.id = u."tenantId"
    WHERE right(regexp_replace(coalesce(u.phone, ''), '\\D', '', 'g'), 10) = ${last10}`;
  console.log(`\nAccounts with mobile …${last10.slice(-4)}: ${rows.length}`);
  for (const r of rows)
    console.log(
      `  - ${r.displayName} · ${r.role} · ${r.email} · saved as "${r.phone}" · ${r.isActive ? "active" : "DISABLED"} · ${r.hasPassword ? "password set" : "NO PASSWORD (invite not accepted)"} · salon ${r.status}`,
    );
  if (!rows.length)
    console.log(
      "  → No account has this number. Add it: owner → Settings → Business profile / Team → Add mobile.",
    );
  if (rows.length > 1)
    console.log(
      "  → Shared number: the password decides which account signs in. If all use the same password, sign in with email.",
    );
} finally {
  await prisma.$disconnect();
}
