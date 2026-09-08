import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import {
  createPurchaseRequestSchema,
  reviewPurchaseRequestSchema,
} from "../schemas/procurement.schema";
import { ProcurementService } from "../services/procurement.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function loadPurchaseRequestDetail(_sql: unknown, idOrRef: string) {
  return await ProcurementService.loadPurchaseRequestDetail(idOrRef);
}

export async function handleProcurementList(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (auth.deny) return auth.deny;

  const url = new URL(request.url);
  const statusQuery = url.searchParams.get("status");

  const list = await ProcurementService.listPurchaseRequests(statusQuery);
  return json(env, request, list);
}

export async function handleProcurementGet(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (auth.deny) return auth.deny;

  const detail = await ProcurementService.loadPurchaseRequestDetail(id);
  if (!detail) {
    return json(env, request, { error: "Purchase requisition not found" }, 404);
  }

  return json(env, request, detail);
}

export async function handleProcurementCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (auth.deny) return auth.deny;

  const rawBody = await readJson(request);
  const parsed = createPurchaseRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "Invalid request body";
    return json(env, request, { error: issue }, 400);
  }

  const { reqId, refNum, calculatedTotal } = await ProcurementService.createPurchaseRequest(
    auth.admin.id,
    parsed.data
  );

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "Requisition Submitted",
    entityType: "PurchaseRequest",
    entityId: reqId,
    actorName: parsed.data.requesterName,
    actorRole: "requester",
    previousStatus: "DRAFT",
    newStatus: "SUBMITTED",
    note: "Initial purchase request submitted.",
    metadata: { ref: refNum, title: parsed.data.title, amount: calculatedTotal },
  });

  const detail = await ProcurementService.loadPurchaseRequestDetail(reqId);
  return json(env, request, detail, 201);
}

export async function handleProcurementReview(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (auth.deny) return auth.deny;

  const rawBody = await readJson(request);
  const parsed = reviewPurchaseRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "Invalid request body";
    return json(env, request, { error: issue }, 400);
  }

  const result = await ProcurementService.reviewPurchaseRequest(id, parsed.data);
  if (!result) {
    return json(env, request, { error: "Purchase requisition not found" }, 404);
  }

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: result.actionLabel,
    entityType: "PurchaseRequest",
    entityId: result.existing.id,
    actorName: auth.admin.name || "Admin",
    actorRole: auth.admin.role,
    previousStatus: result.prevStatus,
    newStatus: result.status,
    note: parsed.data.note || (parsed.data.adminNotes ?? null),
    metadata: {
      ref: result.existing.referenceNumber,
      title: result.existing.title,
    },
  });

  const detail = await ProcurementService.loadPurchaseRequestDetail(result.existing.id);
  return json(env, request, detail);
}

export async function handleProcurementDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (auth.deny) return auth.deny;

  const deleted = await ProcurementService.deletePurchaseRequest(id);
  if (!deleted) {
    return json(env, request, { error: "Purchase requisition not found" }, 404);
  }

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "Requisition Deleted",
    entityType: "PurchaseRequest",
    entityId: deleted.id,
    actorName: auth.admin.name || "Admin",
    actorRole: auth.admin.role,
    previousStatus: deleted.status,
    newStatus: "DELETED",
    note: `Purchase request ${deleted.referenceNumber} was deleted.`,
  });

  return json(env, request, { ok: true, id: deleted.id });
}
