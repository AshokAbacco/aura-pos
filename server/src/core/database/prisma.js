import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../../config/env.js";

/**
 * Connection pool.
 * - Opening a connection to a hosted database (TLS + auth) costs several round trips, so idle
 *   connections are kept for a minute instead of node-postgres' 10-second default.
 * - Hosting networks silently drop connections that look idle for a few minutes. A query sent on such
 *   a dead connection hangs for ~20–30 s before failing over (the "one random request takes 27 s"
 *   symptom). TCP keep-alive probes every 10 s keep the connection visibly alive, and idle connections
 *   are closed after 60 s, well before a network would drop them.
 */
export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: 60_000,
    connectionTimeoutMillis: 15_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
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
