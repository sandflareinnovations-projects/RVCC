import { Hono } from "hono";
import type { Env } from "../../config/env";
import {
  handleProcurementCreate,
  handleProcurementDelete,
  handleProcurementGet,
  handleProcurementList,
  handleProcurementReview,
} from "./controllers/procurement.admin.controller";

export function createProcurementRouter(env: Env) {
  const router = new Hono();

  router.get("/", (c) => handleProcurementList(null, env, c.req.raw));
  router.post("/", (c) => handleProcurementCreate(null, env, c.req.raw));
  router.get("/:id", (c) => handleProcurementGet(null, env, c.req.raw, c.req.param("id")));
  router.post("/:id/review", (c) => handleProcurementReview(null, env, c.req.raw, c.req.param("id")));
  router.delete("/:id", (c) => handleProcurementDelete(null, env, c.req.raw, c.req.param("id")));

  return router;
}
