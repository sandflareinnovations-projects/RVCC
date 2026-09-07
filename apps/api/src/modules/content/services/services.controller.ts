import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { slugify } from "../../../lib/storage";
import { requireAdmin, writeAudit } from "../../auth";
import { CmsServicesService } from "./services.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function handleAdminServicesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const services = await CmsServicesService.listAdminServices();
  return json(env, request, { services });
}

export async function handleAdminServiceGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const service = await CmsServicesService.getServiceById(id);
  if (!service) return json(env, request, { error: "Service not found." }, 404);
  return json(env, request, { service });
}

export async function handleAdminServiceCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as Record<string, unknown> | null;
  if (!raw) return json(env, request, { error: "Invalid JSON body" }, 400);

  const title = String(raw.title ?? "").trim();
  if (!title) return json(env, request, { error: "title is required." }, 400);

  const service = await CmsServicesService.createService({
    title,
    description: String(raw.description ?? "").trim(),
    longDescription: String(raw.longDescription ?? "").trim(),
    image: String(raw.image ?? "").trim(),
    iconName: String(raw.iconName ?? "Wrench").trim(),
    features: Array.isArray(raw.features) ? raw.features.map(String) : [],
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : undefined,
    isActive: typeof raw.isActive === "boolean" ? raw.isActive : undefined,
    slug: raw.slug ? String(raw.slug).trim() : undefined,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "services.created",
    entityType: "Service",
    entityId: service.id,
    metadata: { title },
  });

  return json(env, request, { ok: true, service }, 201);
}

export async function handleAdminServiceUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as Record<string, unknown> | null;
  if (!raw) return json(env, request, { error: "Invalid JSON body" }, 400);

  const existing = await CmsServicesService.getServiceById(id);
  if (!existing) return json(env, request, { error: "Service not found." }, 404);

  const data: Record<string, unknown> = {};
  if (raw.title !== undefined) data.title = String(raw.title).trim();
  if (raw.description !== undefined) data.description = String(raw.description).trim();
  if (raw.longDescription !== undefined) data.longDescription = String(raw.longDescription).trim();
  if (raw.image !== undefined) data.image = String(raw.image).trim();
  if (raw.iconName !== undefined) data.iconName = String(raw.iconName).trim();
  if (Array.isArray(raw.features)) data.features = raw.features.map(String);
  if (typeof raw.sortOrder === "number") data.sortOrder = raw.sortOrder;
  if (typeof raw.isActive === "boolean") data.isActive = raw.isActive;
  if (raw.slug !== undefined) {
    const s = slugify(String(raw.slug));
    if (s && s !== existing.slug) data.slug = s;
  }

  const service = await CmsServicesService.updateService(id, data);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "services.updated",
    entityType: "Service",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, { ok: true, service });
}

export async function handleAdminServiceDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const deleted = await CmsServicesService.deleteService(id);
  if (!deleted) return json(env, request, { error: "Service not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "services.deleted",
    entityType: "Service",
    entityId: id,
    metadata: { title: deleted.title },
  });

  return json(env, request, { ok: true });
}

export async function handleAdminServicesReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as { serviceIds?: unknown } | null;
  if (!raw || !Array.isArray(raw.serviceIds) || raw.serviceIds.length === 0) {
    return json(env, request, { error: "serviceIds must be a non-empty array" }, 400);
  }

  const serviceIds = raw.serviceIds.map(String);
  await CmsServicesService.reorderServices(serviceIds);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "services.reordered",
    entityType: "Service",
    entityId: "order",
    metadata: { count: serviceIds.length },
  });

  return json(env, request, { ok: true });
}

export async function handlePublicServicesRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.replace(/^\/services\/?/, "").split("/").filter(Boolean);

    if (pathParts.length > 0) {
      const slug = pathParts[0];
      const result = await CmsServicesService.getPublicServiceBySlug(slug);
      if (!result) return json(env, request, { error: "Service not found" }, 404);

      return json(env, request, result, 200, {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      });
    }

    const services = await CmsServicesService.listPublicServices();
    return json(env, request, { services }, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    });
  } catch (err) {
    console.error("[public/services]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}
