import { clientPartnerInputSchema } from "@rvcc/schemas";
import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import { ClientsService } from "./clients.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function handleAdminClientsList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const clients = await ClientsService.listAdminClients();
  return json(env, request, { clients });
}

export async function handleAdminClientGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const client = await ClientsService.getClientById(id);
  if (!client) return json(env, request, { error: "Client not found." }, 404);
  return json(env, request, { client });
}

export async function handleAdminClientCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = await readJson(request);
  const parsed = clientPartnerInputSchema.safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: parsed.error.issues[0]?.message || "Invalid payload" }, 400);
  }

  const name = parsed.data.name.trim();
  const logoUrl = parsed.data.logoUrl.trim();
  if (!name || !logoUrl) {
    return json(env, request, { error: "name and logoUrl are required." }, 400);
  }

  const client = await ClientsService.createClient({
    name,
    logoUrl,
    industry: (parsed.data.industry ?? "").trim(),
    websiteUrl: parsed.data.websiteUrl ? parsed.data.websiteUrl.trim() : undefined,
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "clients.created",
    entityType: "ClientPartner",
    entityId: client.id,
    metadata: { name },
  });

  return json(env, request, { ok: true, client }, 201);
}

export async function handleAdminClientUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = await readJson(request);
  const parsed = clientPartnerInputSchema.partial().safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: parsed.error.issues[0]?.message || "Invalid payload" }, 400);
  }

  const existing = await ClientsService.getClientById(id);
  if (!existing) return json(env, request, { error: "Client not found." }, 404);

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
  if (parsed.data.logoUrl !== undefined) data.logoUrl = parsed.data.logoUrl.trim();
  if (parsed.data.industry !== undefined) data.industry = parsed.data.industry.trim();
  if (parsed.data.websiteUrl !== undefined) data.websiteUrl = parsed.data.websiteUrl ? parsed.data.websiteUrl.trim() : null;
  if (parsed.data.sortOrder !== undefined) data.sortOrder = parsed.data.sortOrder;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  const client = await ClientsService.updateClient(id, data);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "clients.updated",
    entityType: "ClientPartner",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, { ok: true, client });
}

export async function handleAdminClientDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const deleted = await ClientsService.deleteClient(id);
  if (!deleted) return json(env, request, { error: "Client not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "clients.deleted",
    entityType: "ClientPartner",
    entityId: id,
    metadata: { name: deleted.name },
  });

  return json(env, request, { ok: true });
}

export async function handleAdminClientsReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as { clientIds?: unknown } | null;
  if (!raw || !Array.isArray(raw.clientIds) || raw.clientIds.length === 0) {
    return json(env, request, { error: "clientIds must be a non-empty array" }, 400);
  }

  const clientIds = raw.clientIds.map(String);
  await ClientsService.reorderClients(clientIds);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "clients.reordered",
    entityType: "ClientPartner",
    entityId: "order",
    metadata: { count: clientIds.length },
  });

  return json(env, request, { ok: true });
}

export async function handlePublicClientsRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    const clients = await ClientsService.listPublicClients();
    return json(env, request, { clients }, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    });
  } catch (err) {
    console.error("[public/clients]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}
