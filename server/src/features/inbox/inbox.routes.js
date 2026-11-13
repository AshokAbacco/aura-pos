/**
 * /api/v1/inbox — messages from the Salora Glam team to this salon (renewal reminders, new plans,
 * announcements), shown in the app's bell. Reachable even when the subscription has expired.
 */
import { Router } from "express";
import { ok } from "../../core/utils/http.js";
import { toJSONSafe } from "../../core/utils/http.js";
import { inbox, markRead } from "../platform-admin/platform.support.js";

export const router = Router();
router.get("/", async (req, res) => {
  ok(res, toJSONSafe(await inbox(req.ctx.tenantId)));
});
router.post("/:id/read", async (req, res) => {
  const id =
    req.params.id === "all"
      ? "all"
      : /^[0-9a-f-]{36}$/i.test(req.params.id)
        ? req.params.id
        : null;
  ok(res, id ? await markRead(req.ctx.tenantId, id) : { ok: false });
});
