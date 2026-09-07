import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import {
  createFolderSchema,
  updateFileSchema,
  updateFolderSchema,
} from "../schemas/file-manager.schema";
import { FileManagerService } from "../services/file-manager.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ── Folders Handlers ─────────────────────────────────────────────────────────

export async function handleAdminFoldersList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const url = new URL(request.url);
  const parentId = url.searchParams.get("parentId") || null;

  const folders = await FileManagerService.listFolders(parentId);
  return json(env, request, { ok: true, folders });
}

export async function handleAdminFolderCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const rawBody = await readJson(request);
  const parsed = createFolderSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "Validation failed";
    return json(env, request, { error: issue }, 400);
  }

  const result = await FileManagerService.createFolder(parsed.data);
  if (result.conflict) {
    return json(env, request, { error: "A folder with this name already exists here." }, 409);
  }

  await writeAudit(sql, {
    adminId: admin.id,
    action: "file_manager.folder_created",
    entityType: "ManagedFolder",
    entityId: result.folder.id,
    metadata: { name: result.folder.name, parentId: result.folder.parentId },
  });

  return json(env, request, { ok: true, folder: result.folder }, 201);
}

export async function handleAdminFolderUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const rawBody = await readJson(request);
  const parsed = updateFolderSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "Validation failed";
    return json(env, request, { error: issue }, 400);
  }

  const folder = await FileManagerService.updateFolder(id, parsed.data);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "file_manager.folder_updated",
    entityType: "ManagedFolder",
    entityId: id,
    metadata: { changed: Object.keys(parsed.data) },
  });

  return json(env, request, { ok: true, folder });
}

export async function handleAdminFolderDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const folder = await FileManagerService.deleteFolder(id);
  if (!folder) return json(env, request, { error: "Folder not found" }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "file_manager.folder_deleted",
    entityType: "ManagedFolder",
    entityId: id,
    metadata: { name: folder.name },
  });

  return json(env, request, { ok: true });
}

// ── Files Handlers ───────────────────────────────────────────────────────────

export async function handleAdminFilesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const url = new URL(request.url);
  const folderId = url.searchParams.get("folderId");
  const search = url.searchParams.get("search")?.trim();
  const fileType = url.searchParams.get("type")?.trim();

  const files = await FileManagerService.listFiles({ folderId, search, fileType });
  return json(env, request, { ok: true, files });
}

export async function handleAdminFileUpload(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(env, request, { error: "Expected multipart form data" }, 400);
  }

  const file = form.get("file");
  const folderId = String(form.get("folderId") ?? "").trim() || null;
  const customName = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;

  if (!(file instanceof File)) {
    return json(env, request, { error: "File is required." }, 400);
  }

  const result = await FileManagerService.uploadFile(env, file, {
    folderId,
    customName,
    description,
  });

  if ("error" in result && result.error) {
    return json(env, request, { error: result.error }, 400);
  }

  const createdFile = (result as any).file;
  await writeAudit(sql, {
    adminId: admin.id,
    action: "file_manager.file_uploaded",
    entityType: "ManagedFile",
    entityId: createdFile.id,
    metadata: {
      name: createdFile.name,
      key: result.key,
      sizeBytes: file.size,
      fileType: createdFile.fileType,
    },
  });

  return json(env, request, { ok: true, file: createdFile }, 201);
}

export async function handleAdminFileUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const rawBody = await readJson(request);
  const parsed = updateFileSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "Validation failed";
    return json(env, request, { error: issue }, 400);
  }

  const file = await FileManagerService.updateFile(id, parsed.data);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "file_manager.file_updated",
    entityType: "ManagedFile",
    entityId: id,
    metadata: { changed: Object.keys(parsed.data) },
  });

  return json(env, request, { ok: true, file });
}

export async function handleAdminFileDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const file = await FileManagerService.deleteFile(env, id);
  if (!file) return json(env, request, { error: "File not found" }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "file_manager.file_deleted",
    entityType: "ManagedFile",
    entityId: id,
    metadata: { name: file.name, key: file.storageKey },
  });

  return json(env, request, { ok: true });
}
