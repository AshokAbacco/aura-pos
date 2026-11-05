/** Salon settings — /api/v1/settings */
import { Router } from "express";
import {
  requirePermission,
  requireWritable,
} from "../../core/middleware/auth.middleware.js";
import * as c from "./settings.controller.js";

export const router = Router();
const manage = [requirePermission("settings.manage"), requireWritable()];

router.get("/", c.get);
router.patch("/profile", ...manage, c.updateProfile);
router.post("/branches", ...manage, c.createBranch);
router.patch("/branches/:id", ...manage, c.updateBranch);
router.post("/branches/:id/resources", ...manage, c.addResource);
router.patch("/resources/:id", ...manage, c.updateResource); // rename, move to another floor, reorder, deactivate
