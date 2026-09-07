import { Hono } from "hono";
import type { Env } from "../../config/env";
import {
  handleAdminFileDelete,
  handleAdminFilesList,
  handleAdminFileUpdate,
  handleAdminFileUpload,
  handleAdminFolderCreate,
  handleAdminFolderDelete,
  handleAdminFoldersList,
  handleAdminFolderUpdate,
} from "./controllers/file-manager.admin.controller";

export function createAdminFileManagerRouter(env: Env) {
  const router = new Hono();

  // Folders
  router.get("/folders", (c) => handleAdminFoldersList(null, env, c.req.raw));
  router.post("/folders", (c) => handleAdminFolderCreate(null, env, c.req.raw));
  router.patch("/folders/:id", (c) => handleAdminFolderUpdate(null, env, c.req.raw, c.req.param("id")));
  router.delete("/folders/:id", (c) => handleAdminFolderDelete(null, env, c.req.raw, c.req.param("id")));

  // Files
  router.get("/files", (c) => handleAdminFilesList(null, env, c.req.raw));
  router.post("/files/upload", (c) => handleAdminFileUpload(null, env, c.req.raw));
  router.patch("/files/:id", (c) => handleAdminFileUpdate(null, env, c.req.raw, c.req.param("id")));
  router.delete("/files/:id", (c) => handleAdminFileDelete(null, env, c.req.raw, c.req.param("id")));

  return router;
}
