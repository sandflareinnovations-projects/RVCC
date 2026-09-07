import { Hono } from "hono";
import type { Env } from "../../config/env";
import {
  handleCareerApplicationsList,
  handleCareerCreate,
  handleCareerDelete,
  handleCareerGet,
  handleCareerPatch,
  handleCareersList,
} from "./controllers/careers.admin.controller";
import {
  handleCareerApply,
  handlePublicCareersList,
} from "./controllers/careers.public.controller";

export function createCareersRouter(env: Env) {
  const router = new Hono();

  // Public
  router.get("/", (c) => handlePublicCareersList(null, env, c.req.raw));
  router.post("/apply", (c) => handleCareerApply(null, env, c.req.raw));

  return router;
}

export function createAdminCareersRouter(env: Env) {
  const router = new Hono();

  router.get("/", (c) => handleCareersList(null, env, c.req.raw));
  router.post("/", (c) => handleCareerCreate(null, env, c.req.raw));
  router.get("/:id", (c) => handleCareerGet(null, env, c.req.raw, c.req.param("id")));
  router.patch("/:id", (c) => handleCareerPatch(null, env, c.req.raw, c.req.param("id")));
  router.delete("/:id", (c) => handleCareerDelete(null, env, c.req.raw, c.req.param("id")));
  router.get("/:id/applications", (c) =>
    handleCareerApplicationsList(null, env, c.req.raw, c.req.param("id"))
  );

  return router;
}
