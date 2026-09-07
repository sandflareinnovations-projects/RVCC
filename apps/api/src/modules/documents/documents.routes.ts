import { Hono } from "hono";
import type { Env } from "../../config/env";
import {
  handleAdminDocumentCreate,
  handleAdminDocumentDelete,
  handleAdminDocumentGet,
  handleAdminDocumentsList,
  handleAdminDocumentsReorder,
  handleAdminDocumentUpdate,
  handleAdminDocumentUpload,
} from "./controllers/documents.admin.controller";
import { handlePublicDocumentsRequest } from "./controllers/documents.public.controller";

/**
 * Creates the modular router for the Documents domain.
 */
export function createDocumentsRouter(env: Env) {
  const router = new Hono();

  // ── Public Routes ──────────────────────────────────────────────────────────
  router.get("/", (c) => handlePublicDocumentsRequest(c.req.raw, env));
  router.get("/:slug", (c) => handlePublicDocumentsRequest(c.req.raw, env, c.req.param("slug")));

  return router;
}

/**
 * Admin sub-router for documents management
 */
export function createAdminDocumentsRouter(env: Env) {
  const router = new Hono();

  router.get("/", (c) => handleAdminDocumentsList(null, env, c.req.raw));
  router.post("/", (c) => handleAdminDocumentCreate(null, env, c.req.raw));
  router.post("/reorder", (c) => handleAdminDocumentsReorder(null, env, c.req.raw));
  router.post("/upload", (c) => handleAdminDocumentUpload(null, env, c.req.raw));
  router.get("/:id", (c) => handleAdminDocumentGet(null, env, c.req.raw, c.req.param("id")));
  router.put("/:id", (c) => handleAdminDocumentUpdate(null, env, c.req.raw, c.req.param("id")));
  router.delete("/:id", (c) => handleAdminDocumentDelete(null, env, c.req.raw, c.req.param("id")));

  return router;
}
