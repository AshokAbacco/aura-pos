import { getLoginMethod } from "../platform-admin/platform.support.js";
import { parse, ok, created, toJSONSafe } from "../../core/utils/http.js";
import * as pub from "./public.service.js";
import { contactSchema } from "./public.validation.js";

export async function plans(_req, res) {
  ok(res, toJSONSafe(await pub.listPublicPlans()));
}

export async function contact(req, res) {
  await pub.saveContact(parse(contactSchema, req.body), req.ip);
  created(res, { received: true });
}

/** Settings the website needs before anyone signs in. */
export async function config(_req, res) {
  res.set("Cache-Control", "public, max-age=30");
  ok(res, { loginMethod: await getLoginMethod() });
}
