/** Public (no login) — /api/v1/public: pricing for the landing site and the contact form. */
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { isTest } from "../../config/env.js";
import { AppError } from "../../core/errors/errors.js";
import * as c from "./public.controller.js";

export const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60000,
  limit: isTest ? 1000 : 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_q, _s, next) =>
    next(
      new AppError(
        429,
        "RATE_LIMITED",
        "Too many messages. Please try again later.",
      ),
    ),
});

router.get("/plans", c.plans);
router.get("/config", c.config); // e.g. how salon users sign in (email / phone / both)
router.post("/contact", contactLimiter, c.contact);
