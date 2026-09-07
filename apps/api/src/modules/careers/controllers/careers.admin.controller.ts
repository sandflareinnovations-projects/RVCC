import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { slugify } from "../../../lib/storage";
import { requireAdmin, writeAudit } from "../../auth";
import {
  createJobPostingSchema,
  patchJobPostingSchema,
} from "../schemas/careers.schema";
import { CareersService } from "../services/careers.service";

export { slugify };

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function handleCareersList(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const rows = await CareersService.listAdminJobs();
  return json(env, request, rows);
}

export async function handleCareerGet(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const job = await CareersService.getJobById(id);
  if (!job) return json(env, request, { error: "Posting not found." }, 404);
  return json(env, request, job);
}

export async function handleCareerApplicationsList(
  sql: unknown,
  env: Env,
  request: Request,
  jobPostingId: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const apps = await CareersService.listApplications(jobPostingId);
  if (!apps) return json(env, request, { error: "Posting not found." }, 404);

  return json(
    env,
    request,
    apps.map((a) => ({
      id: a.id,
      jobPostingId: a.jobPostingId,
      fullName: a.fullName,
      email: a.email,
      phone: a.phone,
      cvFileName: a.cvFileName,
      cvFileUrl: a.cvFileUrl,
      createdAt: a.createdAt.toISOString(),
    }))
  );
}

export async function handleCareerCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const rawBody = await readJson(request);
  const parsed = createJobPostingSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "Validation failed";
    return json(env, request, { error: issue }, 400);
  }

  const row = await CareersService.createJob(admin.id, parsed.data);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "career_posting.created",
    entityType: "JobPosting",
    entityId: row.id,
    metadata: { title: row.title, slug: row.slug },
  });

  return json(env, request, row, 201);
}

export async function handleCareerPatch(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const rawBody = await readJson(request);
  const parsed = patchJobPostingSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "Validation failed";
    return json(env, request, { error: issue }, 400);
  }

  const updated = await CareersService.patchJob(id, parsed.data);
  if (!updated) return json(env, request, { error: "Posting not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "career_posting.updated",
    entityType: "JobPosting",
    entityId: id,
    metadata: { changed: Object.keys(parsed.data) },
  });

  return json(env, request, updated);
}

export async function handleCareerDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const deleted = await CareersService.deleteJob(id);
  if (!deleted) return json(env, request, { error: "Posting not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "career_posting.deleted",
    entityType: "JobPosting",
    entityId: id,
    metadata: { title: deleted.title },
  });

  return json(env, request, { ok: true });
}
