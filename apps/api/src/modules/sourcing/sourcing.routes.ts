import { Hono } from "hono";
import type { Env } from "../../config/env";
import {
  handleRequirementAward,
  handleRequirementCreate,
  handleRequirementDelete,
  handleRequirementExportCsv,
  handleRequirementGet,
  handleRequirementsList,
  handleRequirementUpdate,
} from "./controllers/sourcing.admin.controller";

export function createSourcingAdminRouter(env: Env) {
  const router = new Hono();

  router.get("/requirements", (c) => handleRequirementsList(null, env, c.req.raw));
  router.post("/requirements", (c) => handleRequirementCreate(null, env, c.req.raw));
  router.get("/requirements/:id", (c) => handleRequirementGet(null, env, c.req.raw, c.req.param("id")));
  router.put("/requirements/:id", (c) => handleRequirementUpdate(null, env, c.req.raw, c.req.param("id")));
  router.delete("/requirements/:id", (c) => handleRequirementDelete(null, env, c.req.raw, c.req.param("id")));
  router.post("/requirements/:id/award", (c) => handleRequirementAward(null, env, c.req.raw, c.req.param("id")));
  router.get("/requirements/:id/export", (c) => handleRequirementExportCsv(null, env, c.req.raw, c.req.param("id")));

  return router;
}
