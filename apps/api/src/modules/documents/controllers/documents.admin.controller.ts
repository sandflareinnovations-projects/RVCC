import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import {
  createDocumentSchema,
  reorderDocumentsSchema,
  updateDocumentSchema,
} from "../schemas/documents.schema";
import { DocumentsService } from "../services/documents.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function handleAdminDocumentsList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const documents = await DocumentsService.listDocuments();
  return json(env, request, { ok: true, documents });
}

export async function handleAdminDocumentGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const document = await DocumentsService.getDocumentById(id);
  if (!document) {
    return json(env, request, { error: "Document not found." }, 404);
  }

  return json(env, request, { ok: true, document });
}

export async function handleAdminDocumentCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const rawBody = await readJson(request);
  if (!rawBody) return json(env, request, { error: "Invalid JSON body" }, 400);

  const parsed = createDocumentSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "Validation failed";
    return json(env, request, { error: issue }, 400);
  }

  const document = await DocumentsService.createDocument(parsed.data);

  await writeAudit(sql, {
    adminId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    action: "CREATE_DOCUMENT",
    entityType: "CompanyDocument",
    entityId: document.id,
    newStatus: document.isPublished ? "PUBLISHED" : "DRAFT",
    note: `Created document "${document.title}"`,
  });

  return json(env, request, { ok: true, document }, 201);
}

export async function handleAdminDocumentUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const rawBody = await readJson(request);
  if (!rawBody) return json(env, request, { error: "Invalid JSON body" }, 400);

  const parsed = updateDocumentSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "Validation failed";
    return json(env, request, { error: issue }, 400);
  }

  const document = await DocumentsService.updateDocument(id, parsed.data);
  if (!document) {
    return json(env, request, { error: "Document not found." }, 404);
  }

  await writeAudit(sql, {
    adminId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    action: "UPDATE_DOCUMENT",
    entityType: "CompanyDocument",
    entityId: document.id,
    note: `Updated document "${document.title}"`,
  });

  return json(env, request, { ok: true, document });
}

export async function handleAdminDocumentDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "SUPER_ADMIN");
  if (deny) return deny;

  const result = await DocumentsService.deleteDocument(id);
  if (!result) {
    return json(env, request, { error: "Document not found." }, 404);
  }

  await writeAudit(sql, {
    adminId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    action: "DELETE_DOCUMENT",
    entityType: "CompanyDocument",
    entityId: id,
    note: `Deleted document "${result.title}"`,
  });

  return json(env, request, { ok: true });
}

export async function handleAdminDocumentsReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const rawBody = await readJson(request);
  const parsed = reorderDocumentsSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "No document IDs provided.";
    return json(env, request, { error: issue }, 400);
  }

  await DocumentsService.reorderDocuments(parsed.data.orderedIds);

  await writeAudit(sql, {
    adminId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    action: "REORDER_DOCUMENTS",
    entityType: "CompanyDocument",
    entityId: "batch",
    note: `Reordered ${parsed.data.orderedIds.length} documents`,
  });

  return json(env, request, { ok: true });
}

export async function handleAdminDocumentUpload(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "ADMIN");
  if (deny) return deny;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const docType = (formData.get("type") as string) || "document";
    const title = (formData.get("title") as string) || "document";

    if (!file || typeof file === "string") {
      return json(env, request, { error: "No valid file uploaded." }, 400);
    }

    const uploadResult = await DocumentsService.uploadAsset(env, file as File, docType, title);
    return json(env, request, { ok: true, ...uploadResult });
  } catch (err: any) {
    console.error("[admin/documents/upload]", err);
    return json(env, request, { error: err?.message || "Upload failed." }, 500);
  }
}
