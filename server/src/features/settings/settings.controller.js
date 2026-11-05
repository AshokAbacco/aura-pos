import { parse, ok, created, toJSONSafe } from "../../core/utils/http.js";
import * as settings from "./settings.service.js";
import {
  profileSchema,
  branchSchema,
  branchUpdateSchema,
  resourceSchema,
  resourceUpdateSchema,
} from "./settings.validation.js";

export async function get(req, res) {
  ok(res, toJSONSafe(await settings.getSettings(req.ctx)));
}
export async function updateProfile(req, res) {
  ok(
    res,
    toJSONSafe(
      await settings.updateProfile(req.ctx, parse(profileSchema, req.body)),
    ),
  );
}
export async function createBranch(req, res) {
  created(
    res,
    toJSONSafe(
      await settings.createBranch(req.ctx, parse(branchSchema, req.body)),
    ),
  );
}
export async function updateBranch(req, res) {
  ok(
    res,
    toJSONSafe(
      await settings.updateBranch(
        req.ctx,
        req.params.id,
        parse(branchUpdateSchema, req.body),
      ),
    ),
  );
}
export async function addResource(req, res) {
  created(
    res,
    toJSONSafe(
      await settings.addResource(
        req.ctx,
        req.params.id,
        parse(resourceSchema, req.body),
      ),
    ),
  );
}
export async function updateResource(req, res) {
  ok(
    res,
    toJSONSafe(
      await settings.updateResource(
        req.ctx,
        req.params.id,
        parse(resourceUpdateSchema, req.body),
      ),
    ),
  );
}
