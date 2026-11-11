import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../../config/env.js";

/**
 * Connection pool. Opening a connection to a hosted database (TLS + auth) costs several network
 * round trips, so connections are kept open for 5 minutes of idleness instead of node-postgres'
 * 10-second default; otherwise almost every page after a short pause paid that cost again.
 */
export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: 5 * 60_000,
    connectionTimeoutMillis: 15_000,
    keepAlive: true,
  }),
});
export { Prisma };

/** Postgres error helpers (driver-adapter errors surface the SQLSTATE in different places). */
export function pgCode(err) {
  return err?.code === "P2002"
    ? "23505"
    : (err?.meta?.driverAdapterError?.cause?.originalCode ??
        err?.meta?.code ??
        err?.cause?.code ??
        err?.code);
}
export const isUniqueViolation = (err) =>
  err?.code === "P2002" || pgCode(err) === "23505";
export const isCheckViolation = (err) =>
  pgCode(err) === "23514" ||
  /violates check constraint/i.test(err?.message ?? "");
export const isExclusionViolation = (err) =>
  pgCode(err) === "23P01" ||
  /violates exclusion constraint/i.test(err?.message ?? "");
