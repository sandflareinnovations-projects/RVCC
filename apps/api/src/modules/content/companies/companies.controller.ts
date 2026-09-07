import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import { CompaniesService } from "./companies.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function handleAdminCompaniesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const companies = await CompaniesService.listAdminCompanies();
  return json(env, request, { companies });
}

export async function handleAdminCompanyGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const company = await CompaniesService.getCompanyById(id);
  if (!company) return json(env, request, { error: "Company not found." }, 404);
  return json(env, request, { company });
}

export async function handleAdminCompanyCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as Record<string, unknown> | null;
  if (!raw) return json(env, request, { error: "Invalid JSON body" }, 400);

  const name = String(raw.name ?? "").trim();
  const logoUrl = String(raw.logoUrl ?? "").trim();

  if (!name || !logoUrl) {
    return json(env, request, { error: "name and logoUrl are required." }, 400);
  }

  const company = await CompaniesService.createCompany({
    name,
    logoUrl,
    industry: String(raw.industry ?? "").trim(),
    websiteUrl: raw.websiteUrl ? String(raw.websiteUrl).trim() : undefined,
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : undefined,
    isActive: typeof raw.isActive === "boolean" ? raw.isActive : undefined,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "companies.created",
    entityType: "SisterCompany",
    entityId: company.id,
    metadata: { name },
  });

  return json(env, request, { ok: true, company }, 201);
}

export async function handleAdminCompanyUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as Record<string, unknown> | null;
  if (!raw) return json(env, request, { error: "Invalid JSON body" }, 400);

  const existing = await CompaniesService.getCompanyById(id);
  if (!existing) return json(env, request, { error: "Company not found." }, 404);

  const data: Record<string, unknown> = {};
  if (raw.name !== undefined) data.name = String(raw.name).trim();
  if (raw.logoUrl !== undefined) data.logoUrl = String(raw.logoUrl).trim();
  if (raw.industry !== undefined) data.industry = String(raw.industry).trim();
  if (raw.websiteUrl !== undefined) data.websiteUrl = raw.websiteUrl ? String(raw.websiteUrl).trim() : null;
  if (typeof raw.sortOrder === "number") data.sortOrder = raw.sortOrder;
  if (typeof raw.isActive === "boolean") data.isActive = raw.isActive;

  const company = await CompaniesService.updateCompany(id, data);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "companies.updated",
    entityType: "SisterCompany",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, { ok: true, company });
}

export async function handleAdminCompanyDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const deleted = await CompaniesService.deleteCompany(id);
  if (!deleted) return json(env, request, { error: "Company not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "companies.deleted",
    entityType: "SisterCompany",
    entityId: id,
    metadata: { name: deleted.name },
  });

  return json(env, request, { ok: true });
}

export async function handleAdminCompaniesReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as { companyIds?: unknown } | null;
  if (!raw || !Array.isArray(raw.companyIds) || raw.companyIds.length === 0) {
    return json(env, request, { error: "companyIds must be a non-empty array" }, 400);
  }

  const companyIds = raw.companyIds.map(String);
  await CompaniesService.reorderCompanies(companyIds);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "companies.reordered",
    entityType: "SisterCompany",
    entityId: "order",
    metadata: { count: companyIds.length },
  });

  return json(env, request, { ok: true });
}

export async function handlePublicSisterCompaniesRequest(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    const companies = await CompaniesService.listPublicCompanies();
    return json(env, request, { companies }, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    });
  } catch (err) {
    console.error("[public/sister-companies]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}
