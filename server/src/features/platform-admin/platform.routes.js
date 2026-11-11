/**
 * Platform Super Admin — /api/v1/platform
 * Separate principal table, token audience ("platform"), refresh cookie and path:
 * a salon owner's token can never authenticate here.
 */
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { isTest } from "../../config/env.js";
import { AppError } from "../../core/errors/errors.js";
import { authenticatePlatform } from "../../core/middleware/auth.middleware.js";
import * as c from "./platform.controller.js";

export const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60000,
  limit: isTest ? 1000 : 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_q, _s, next) =>
    next(new AppError(429, "RATE_LIMITED", "Too many attempts")),
});

router.post("/auth/login", loginLimiter, c.login);
router.post("/auth/refresh", c.refresh);
router.post("/auth/logout", c.logout);

router.use(authenticatePlatform); // everything below requires a platform admin
router.get("/stats", c.stats);
router.get("/tenants", c.listTenants);
router.get("/tenants/:id", c.getTenant);
router.post("/tenants/:id/suspend", c.suspend);
router.post("/tenants/:id/reactivate", c.reactivate);
router.post("/tenants/:id/extend", c.extend); // add days to the current period (audited)
router.post("/tenants/:id/plan", c.changePlan); // move to another plan without payment (audited)
router.get("/plans", c.listPlans);
router.post("/plans", c.createPlan);
router.patch("/plans/:id", c.updatePlan);
router.get("/payments", c.listPayments);
router.get("/webhooks", c.listWebhooks);
router.get("/contacts", c.listContacts);
router.patch("/contacts/:id", c.setContactStatus);
router.get("/audit", c.listAudit);
