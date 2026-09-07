import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import { HeroService } from "./hero.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function handleAdminHeroSlidesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const slides = await HeroService.listAdminSlides();
  return json(env, request, { slides });
}

export async function handleAdminHeroSlideGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const slide = await HeroService.getSlideById(id);
  if (!slide) return json(env, request, { error: "Slide not found." }, 404);
  return json(env, request, { slide });
}

export async function handleAdminHeroSlideCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as Record<string, unknown> | null;
  if (!raw) return json(env, request, { error: "Invalid JSON body" }, 400);

  const title1 = String(raw.title1 ?? "").trim();
  const title2 = String(raw.title2 ?? "").trim();
  const imageUrl = String(raw.imageUrl ?? "").trim();

  if (!title1 || !title2 || !imageUrl) {
    return json(env, request, { error: "title1, title2, and imageUrl are required." }, 400);
  }

  const slide = await HeroService.createSlide({
    title1,
    title2,
    imageUrl,
    description: String(raw.description ?? "").trim(),
    badge: String(raw.badge ?? "").trim(),
    primaryBtnText: raw.primaryBtnText ? String(raw.primaryBtnText).trim() : undefined,
    primaryBtnLink: raw.primaryBtnLink ? String(raw.primaryBtnLink).trim() : undefined,
    secondaryBtnText: raw.secondaryBtnText ? String(raw.secondaryBtnText).trim() : undefined,
    secondaryBtnLink: raw.secondaryBtnLink ? String(raw.secondaryBtnLink).trim() : undefined,
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : undefined,
    isActive: typeof raw.isActive === "boolean" ? raw.isActive : undefined,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slides.created",
    entityType: "HeroSlide",
    entityId: slide.id,
    metadata: { title1, title2 },
  });

  return json(env, request, { ok: true, slide }, 201);
}

export async function handleAdminHeroSlideUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as Record<string, unknown> | null;
  if (!raw) return json(env, request, { error: "Invalid JSON body" }, 400);

  const existing = await HeroService.getSlideById(id);
  if (!existing) return json(env, request, { error: "Slide not found." }, 404);

  const data: Record<string, unknown> = {};
  if (raw.title1 !== undefined) data.title1 = String(raw.title1).trim();
  if (raw.title2 !== undefined) data.title2 = String(raw.title2).trim();
  if (raw.imageUrl !== undefined) data.imageUrl = String(raw.imageUrl).trim();
  if (raw.description !== undefined) data.description = String(raw.description).trim();
  if (raw.badge !== undefined) data.badge = String(raw.badge).trim();
  if (raw.primaryBtnText !== undefined) data.primaryBtnText = raw.primaryBtnText ? String(raw.primaryBtnText).trim() : null;
  if (raw.primaryBtnLink !== undefined) data.primaryBtnLink = raw.primaryBtnLink ? String(raw.primaryBtnLink).trim() : null;
  if (raw.secondaryBtnText !== undefined) data.secondaryBtnText = raw.secondaryBtnText ? String(raw.secondaryBtnText).trim() : null;
  if (raw.secondaryBtnLink !== undefined) data.secondaryBtnLink = raw.secondaryBtnLink ? String(raw.secondaryBtnLink).trim() : null;
  if (typeof raw.sortOrder === "number") data.sortOrder = raw.sortOrder;
  if (typeof raw.isActive === "boolean") data.isActive = raw.isActive;

  const slide = await HeroService.updateSlide(id, data);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slides.updated",
    entityType: "HeroSlide",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, { ok: true, slide });
}

export async function handleAdminHeroSlideDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const deleted = await HeroService.deleteSlide(id);
  if (!deleted) return json(env, request, { error: "Slide not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slides.deleted",
    entityType: "HeroSlide",
    entityId: id,
    metadata: { title1: deleted.title1, title2: deleted.title2 },
  });

  return json(env, request, { ok: true });
}

export async function handleAdminHeroSlidesReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as { slideIds?: unknown } | null;
  if (!raw || !Array.isArray(raw.slideIds) || raw.slideIds.length === 0) {
    return json(env, request, { error: "slideIds must be a non-empty array" }, 400);
  }

  const slideIds = raw.slideIds.map(String);
  await HeroService.reorderSlides(slideIds);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slides.reordered",
    entityType: "HeroSlide",
    entityId: "order",
    metadata: { count: slideIds.length },
  });

  return json(env, request, { ok: true });
}

export async function handlePublicHeroRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    const slides = await HeroService.listPublicSlides();
    return json(env, request, { slides }, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    });
  } catch (err) {
    console.error("[public/hero-slides]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}
