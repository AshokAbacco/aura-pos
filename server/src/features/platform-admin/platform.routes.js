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

/**
 * Two kinds of platform admin:
 * - SUPPORT (customer support team): sees everything, searches, keeps notes and follow-ups,
 *   messages salons, signs a salon user out of their devices, handles enquiries.
 * - SUPER_ADMIN: all of that, plus money and access: extend / change plan, suspend / reactivate,
 *   plans, platform team, platform settings.
 */
const superOnly = (req, _res, next) => {
  if (req.ctx.admin.role !== "SUPER_ADMIN")
    throw new AppError(403, "FORBIDDEN", "Only a super admin can do this");
  next();
};

router.get("/auth/me", c.me);
router.get("/stats", c.stats);
router.get("/search", c.search); // universal search
router.get("/salons", c.listSalons); // list with filters and sorting
router.get("/tenants", c.listTenants);
router.get("/tenants/:id", c.getTenant);
router.get("/tenants/:id/activity", c.salonActivity);
router.get("/tenants/:id/users/:userId", c.salonUser);
router.post("/tenants/:id/users/:userId/sign-out", c.signOutSalonUser);
router.get("/tenants/:id/notes", c.listNotes);
router.post("/tenants/:id/notes", c.addNote);
router.patch("/notes/:noteId", c.updateNote);
router.get("/follow-ups", c.followUps); // renewals desk
router.get("/messages", c.listMessages);
router.post("/messages", c.sendMessage); // renewal reminder / new plan alert / announcement
router.post("/tenants/:id/suspend", superOnly, c.suspend);
router.post("/tenants/:id/reactivate", superOnly, c.reactivate);
router.post("/tenants/:id/extend", superOnly, c.extend); // add days to the current period (audited)
router.post("/tenants/:id/plan", superOnly, c.changePlan); // move to another plan without payment (audited)
router.get("/plans", c.listPlans);
router.post("/plans", superOnly, c.createPlan);
router.patch("/plans/:id", superOnly, c.updatePlan);
router.get("/payments", c.listPayments);
router.get("/webhooks", c.listWebhooks);
router.get("/contacts", c.listContacts);
router.patch("/contacts/:id", c.setContactStatus);
router.get("/audit", c.listAudit);
router.get("/admins", superOnly, c.listAdmins);
router.post("/admins", superOnly, c.createAdmin);
router.patch("/admins/:adminId", superOnly, c.updateAdmin);
router.get("/settings", c.getSettings);
router.put("/settings", superOnly, c.updateSettings);
