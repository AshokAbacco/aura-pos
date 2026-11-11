/**
 * Express application. Each business area lives in src/features/<name>/ with:
 *   <name>.routes.js      endpoints + who may call them
 *   <name>.controller.js  request parsing and response shaping
 *   <name>.service.js     business logic and database work
 *   <name>.validation.js  zod schemas for request bodies
 * Shared plumbing lives in src/core/ (database, errors, logger, mail, money, utils, middleware),
 * external services in src/integrations/ (Razorpay), scheduled tasks in src/jobs/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { prisma } from "./core/database/prisma.js";
import {
  requestId,
  requestLogger,
} from "./core/middleware/request.middleware.js";
import {
  notFoundHandler,
  errorHandler,
} from "./core/middleware/error.middleware.js";
import {
  authenticate,
  requireReadable,
} from "./core/middleware/auth.middleware.js";

import { router as authRoutes } from "./features/auth/auth.routes.js";
import { router as publicRoutes } from "./features/public/public.routes.js";
import { router as platformRoutes } from "./features/platform-admin/platform.routes.js";
import { router as subscriptionRoutes } from "./features/subscription/subscription.routes.js";
import { router as webhookRoutes } from "./integrations/razorpay/razorpay.webhook.routes.js";
import { router as invoiceRoutes } from "./features/invoices/invoices.routes.js";
import { router as pnlRoutes } from "./features/pnl/pnl.routes.js";
import { router as posRoutes } from "./features/pos/pos.routes.js";
import { router as catalogRoutes } from "./features/catalog/catalog.routes.js";
import { router as inventoryRoutes } from "./features/inventory/inventory.routes.js";
import { router as clientRoutes } from "./features/clients/clients.routes.js";
import { router as membershipRoutes } from "./features/memberships/memberships.routes.js";
import { router as staffRoutes } from "./features/staff/staff.routes.js";
import { router as appointmentRoutes } from "./features/appointments/appointments.routes.js";
import { router as expenseRoutes } from "./features/expenses/expenses.routes.js";
import { router as reportRoutes } from "./features/reports/reports.routes.js";
import { router as settingsRoutes } from "./features/settings/settings.routes.js";
import { router as userRoutes } from "./features/users/users.routes.js";

const CLIENT_DIST = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../client/dist",
);

export function createApp() {
  const app = express();
  app.use(compression()); // gzip JSON and the website files (smaller downloads on mobile data)
  app.disable("x-powered-by");
  if (env.TRUST_PROXY) app.set("trust proxy", env.TRUST_PROXY);

  app.use(requestId, requestLogger);
  app.use(helmet({ contentSecurityPolicy: false })); // CSP for the SPA is set below when serving it
  app.use(
    cors({
      origin: [env.CLIENT_ORIGIN, ...env.EXTRA_CORS_ORIGINS],
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Idempotency-Key",
        "X-Branch-Id",
        "X-Client-Platform",
      ],
      exposedHeaders: ["x-request-id", "content-disposition"],
    }),
  );

  // Health checks — no auth, never cached. Use for Render's health check and uptime pingers.
  //   /health (/api/v1/health): the process is up (cheap; does not touch the database)
  //   /ready  (/api/v1/ready) : the process can reach PostgreSQL (503 if not)
  // GET and HEAD both work (some uptime monitors send HEAD).
  const health = (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({
      status: "ok",
      uptimeSec: Math.round(process.uptime()),
      time: new Date().toISOString(),
    });
  };
  const ready = async (_req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ready", database: "ok" });
    } catch {
      res.status(503).json({ status: "not_ready", database: "unavailable" });
    }
  };
  app.get(["/health", "/api/v1/health"], health);
  app.get(["/ready", "/api/v1/ready"], ready);

  // Webhooks need the exact raw bytes for signature verification → mounted BEFORE the JSON parser.
  app.use(
    "/api/v1/webhooks",
    express.raw({ type: "application/json", limit: "256kb" }),
    webhookRoutes,
  );
  app.use(express.json({ limit: "200kb" }));
  app.use(cookieParser());

  const api = express.Router();
  // No login needed
  api.use("/auth", authRoutes);
  api.use("/public", publicRoutes);
  api.use("/platform", platformRoutes);
  // Logged in, but reachable even when the subscription has expired (so the salon can renew)
  api.use("/billing", authenticate, subscriptionRoutes);
  // Salon business features: logged in + account not suspended. Writes also check the subscription.
  const salon = express.Router();
  salon.use(authenticate, requireReadable);
  salon.use("/pos", posRoutes);
  salon.use("/invoices", invoiceRoutes);
  salon.use("/catalog", catalogRoutes);
  salon.use("/inventory", inventoryRoutes);
  salon.use("/clients", clientRoutes);
  salon.use("/memberships", membershipRoutes);
  salon.use("/staff", staffRoutes);
  salon.use("/appointments", appointmentRoutes);
  salon.use("/expenses", expenseRoutes);
  salon.use("/pnl", pnlRoutes);
  salon.use("/reports", reportRoutes);
  salon.use("/settings", settingsRoutes);
  salon.use("/users", userRoutes);
  api.use(salon);
  app.use("/api/v1", api);
  app.use("/api", notFoundHandler);

  // Production: serve the built React client from the same origin (single process, single port).
  if (env.SERVE_CLIENT && fs.existsSync(path.join(CLIENT_DIST, "index.html"))) {
    // Built files in /assets have a content hash in their name, so browsers may keep them for a year;
    // everything else (index.html) is re-checked so a new deploy shows up immediately.
    app.use(
      "/assets",
      express.static(path.join(CLIENT_DIST, "assets"), {
        immutable: true,
        maxAge: "365d",
      }),
    );
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: 0 }));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' https://checkout.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com https://www.google.com https://maps.google.com; connect-src 'self' https://lumberjack.razorpay.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com",
      );
      res.sendFile(path.join(CLIENT_DIST, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
