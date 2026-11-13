/**
 * Create or change the Platform Super Admin login (the /platform sign-in).
 *
 *   npm run admin:set -- --email you@company.com
 *       → asks for the new password (min 12 characters, typed twice)
 *
 *   npm run admin:set -- --email you@company.com --from admin@aura.local
 *       → changes that existing admin's email (and password) instead of adding another admin
 *
 *   npm run admin:set -- --list                  → shows all platform admins
 *   npm run admin:set -- --disable old@x.com     → blocks an admin from signing in
 *
 * Options: --name "Your Name", --password "…" (skips the prompt; avoid: it stays in shell history).
 * Every change signs that admin out everywhere (all their sessions are revoked).
 * Uses DATABASE_URL from server/.env — point it at the production database to change production.
 */
import "dotenv/config";
import readline from "node:readline";
import { prisma } from "../src/core/database/prisma.js";
import { hashPassword } from "../src/features/auth/auth.sessions.js";

function args() {
  const out = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith("--")) continue;
    const key = a[i].slice(2);
    out[key] = a[i + 1] && !a[i + 1].startsWith("--") ? a[++i] : true;
  }
  return out;
}

/** Ask a question; with `hidden` the typed characters are not echoed. */
function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    if (hidden)
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
      };
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

async function revokeSessions(adminId, reason) {
  const r = await prisma.session.updateMany({
    where: { principalType: "platform", principalId: adminId, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: reason },
  });
  return r.count;
}

async function main() {
  const o = args();

  if (o.list) {
    const admins = await prisma.platformAdmin.findMany({
      orderBy: { createdAt: "asc" },
    });
    if (!admins.length) console.log("No platform admins yet.");
    for (const a of admins)
      console.log(
        `${a.isActive ? "active  " : "DISABLED"}  ${a.email}  (${a.name})  last sign-in: ${a.lastLoginAt?.toISOString() ?? "never"}`,
      );
    return;
  }

  if (o.disable) {
    const a = await prisma.platformAdmin.findUnique({
      where: { email: String(o.disable).toLowerCase() },
    });
    if (!a) throw new Error(`No platform admin with email ${o.disable}`);
    const active = await prisma.platformAdmin.count({
      where: { isActive: true },
    });
    if (a.isActive && active <= 1)
      throw new Error(
        "This is the only active admin. Create another one first, then disable this one.",
      );
    await prisma.platformAdmin.update({
      where: { id: a.id },
      data: { isActive: false },
    });
    console.log(
      `Disabled ${a.email}; signed out of ${await revokeSessions(a.id, "ADMIN_DISABLED")} session(s).`,
    );
    return;
  }

  const email = String(o.email ?? "")
    .trim()
    .toLowerCase();
  if (!emailOk(email))
    throw new Error(
      "Give the new login email: npm run admin:set -- --email you@company.com",
    );

  let password = typeof o.password === "string" ? o.password : null;
  if (!password) {
    password = await ask("New password (min 12 characters): ", true);
    const again = await ask("Type it again: ", true);
    if (password !== again)
      throw new Error("The two passwords are different. Nothing was changed.");
  }
  if (password.length < 12)
    throw new Error(
      "Password must be at least 12 characters. Nothing was changed.",
    );

  const from = o.from ? String(o.from).trim().toLowerCase() : email;
  const existing = await prisma.platformAdmin.findUnique({
    where: { email: from },
  });
  if (from !== email && !existing)
    throw new Error(
      `No platform admin with email ${from}. Run with --list to see them.`,
    );
  if (
    from !== email &&
    (await prisma.platformAdmin.findUnique({ where: { email } }))
  ) {
    throw new Error(
      `${email} is already a platform admin. Change its password with: npm run admin:set -- --email ${email}`,
    );
  }

  const passwordHash = await hashPassword(password);
  if (existing) {
    const a = await prisma.platformAdmin.update({
      where: { id: existing.id },
      data: {
        email,
        passwordHash,
        isActive: true,
        ...(typeof o.name === "string" ? { name: o.name } : {}),
      },
    });
    const n = await revokeSessions(a.id, "CREDENTIALS_CHANGED");
    console.log(
      `Updated platform admin: ${from === email ? email : `${from} → ${email}`} (new password set; signed out of ${n} session(s)).`,
    );
  } else {
    await prisma.platformAdmin.create({
      data: {
        email,
        passwordHash,
        name: typeof o.name === "string" ? o.name : "Platform Admin",
      },
    });
    console.log(`Created platform admin: ${email}`);
    const demo = await prisma.platformAdmin.findUnique({
      where: { email: "admin@aura.local" },
    });
    if (demo?.isActive)
      console.log(
        "Tip: the demo admin admin@aura.local still works. Disable it with: npm run admin:set -- --disable admin@aura.local",
      );
  }
}

main()
  .catch((e) => {
    console.error(`Error: ${e.message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
