import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { slugify } from "../../../lib/storage";
import { requireAdmin, writeAudit } from "../../auth";
import { ProjectsService } from "./projects.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function handleAdminProjectsList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const projects = await ProjectsService.listAdminProjects();
  return json(env, request, { projects });
}

export async function handleAdminProjectGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const project = await ProjectsService.getProjectById(id);
  if (!project) return json(env, request, { error: "Project not found." }, 404);
  return json(env, request, { project });
}

export async function handleAdminProjectCreate(
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

  const project = await ProjectsService.createProject({
    title,
    category: String(raw.category ?? "").trim(),
    serviceSlugs: Array.isArray(raw.serviceSlugs) ? raw.serviceSlugs.map(String) : [],
    client: String(raw.client ?? "").trim(),
    location: String(raw.location ?? "").trim(),
    year: String(raw.year ?? "").trim(),
    status: String(raw.status ?? "Completed").trim(),
    description: String(raw.description ?? "").trim(),
    coverImage: String(raw.coverImage ?? "").trim(),
    scope: Array.isArray(raw.scope) ? raw.scope.map(String) : [],
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : undefined,
    isActive: typeof raw.isActive === "boolean" ? raw.isActive : undefined,
    slug: raw.slug ? String(raw.slug).trim() : undefined,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "projects.created",
    entityType: "Project",
    entityId: project.id,
    metadata: { title },
  });

  return json(env, request, { ok: true, project }, 201);
}

export async function handleAdminProjectUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as Record<string, unknown> | null;
  if (!raw) return json(env, request, { error: "Invalid JSON body" }, 400);

  const existing = await ProjectsService.getProjectById(id);
  if (!existing) return json(env, request, { error: "Project not found." }, 404);

  const data: Record<string, unknown> = {};
  if (raw.title !== undefined) data.title = String(raw.title).trim();
  if (raw.category !== undefined) data.category = String(raw.category).trim();
  if (Array.isArray(raw.serviceSlugs)) data.serviceSlugs = raw.serviceSlugs.map(String);
  if (raw.client !== undefined) data.client = String(raw.client).trim();
  if (raw.location !== undefined) data.location = String(raw.location).trim();
  if (raw.year !== undefined) data.year = String(raw.year).trim();
  if (raw.status !== undefined) data.status = String(raw.status).trim();
  if (raw.description !== undefined) data.description = String(raw.description).trim();
  if (raw.coverImage !== undefined) data.coverImage = String(raw.coverImage).trim();
  if (Array.isArray(raw.scope)) data.scope = raw.scope.map(String);
  if (typeof raw.sortOrder === "number") data.sortOrder = raw.sortOrder;
  if (typeof raw.isActive === "boolean") data.isActive = raw.isActive;
  if (raw.slug !== undefined) {
    const s = slugify(String(raw.slug));
    if (s && s !== existing.slug) data.slug = s;
  }

  const project = await ProjectsService.updateProject(id, data);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "projects.updated",
    entityType: "Project",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, { ok: true, project });
}

export async function handleAdminProjectDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const deleted = await ProjectsService.deleteProject(id);
  if (!deleted) return json(env, request, { error: "Project not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "projects.deleted",
    entityType: "Project",
    entityId: id,
    metadata: { title: deleted.title },
  });

  return json(env, request, { ok: true });
}

export async function handleAdminProjectsReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as { projectIds?: unknown } | null;
  if (!raw || !Array.isArray(raw.projectIds) || raw.projectIds.length === 0) {
    return json(env, request, { error: "projectIds must be a non-empty array" }, 400);
  }

  const projectIds = raw.projectIds.map(String);
  await ProjectsService.reorderProjects(projectIds);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "projects.reordered",
    entityType: "Project",
    entityId: "order",
    metadata: { count: projectIds.length },
  });

  return json(env, request, { ok: true });
}

export async function handlePublicProjectsRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.replace(/^\/projects\/?/, "").split("/").filter(Boolean);

    if (pathParts.length > 0) {
      const slug = pathParts[0];
      const project = await ProjectsService.getPublicProjectBySlug(slug);
      if (!project) return json(env, request, { error: "Project not found" }, 404);

      return json(env, request, { project }, 200, {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      });
    }

    const projects = await ProjectsService.listPublicProjects();
    return json(env, request, { projects }, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    });
  } catch (err) {
    console.error("[public/projects]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}
