import type { Env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import {
  detectMagicMime,
  MAX_CV_BYTES,
  publicUploadUrl,
  putUpload,
  slugify,
  storageKeyForCareer,
  uploadStorageConfigured,
  validateUploadBytes,
  validateUploadFile,
} from "../../../lib/storage";
import type {
  CreateJobPostingInput,
  PatchJobPostingInput,
} from "../schemas/careers.schema";

export class CareersService {
  /**
   * List all published jobs for the public careers page
   */
  static async listPublicJobs() {
    const rows = await prisma.jobPosting.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [
        { sortOrder: "asc" },
        { postedAt: "desc" },
      ],
    });

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      department: r.department,
      location: r.location,
      type: r.employmentType,
      postedAt: r.postedAt ? r.postedAt.toISOString().slice(0, 10) : "",
      description: r.description ?? "",
      requirements: Array.isArray(r.requirements) ? r.requirements : [],
      benefits: Array.isArray(r.benefits) ? r.benefits : [],
      isRemote: Boolean(r.isRemote),
    }));
  }

  /**
   * Public: submit a job application with CV upload
   */
  static async applyForJob(
    env: Env,
    file: File,
    input: { jobPostingId: string; fullName: string; email: string; phone?: string }
  ) {
    if (!uploadStorageConfigured(env)) {
      return { error: "Upload storage not configured", status: 503 as const };
    }

    const fileError = validateUploadFile(file, {
      maxBytes: MAX_CV_BYTES,
      allowedMimes: new Set(["application/pdf"]),
    });
    if (fileError) return { error: fileError, status: 400 as const };

    const job = await prisma.jobPosting.findFirst({
      where: { id: input.jobPostingId, isPublished: true, deletedAt: null },
      select: { id: true },
    });
    if (!job) {
      return { error: "Job not found or not accepting applications", status: 404 as const };
    }

    const key = storageKeyForCareer(input.jobPostingId, file.name);
    const bytes = await file.arrayBuffer();
    const byteError = validateUploadBytes(new Uint8Array(bytes), {
      maxBytes: MAX_CV_BYTES,
      allowedMimes: new Set(["application/pdf"]),
    });
    if (byteError) return { error: byteError, status: 400 as const };

    const detectedMime = detectMagicMime(new Uint8Array(bytes));
    const mimeType = detectedMime || file.type || "application/pdf";

    await putUpload(env, key, bytes, mimeType);

    const id = cuid();
    const fileUrl = publicUploadUrl(env, key);

    await prisma.jobApplication.create({
      data: {
        id,
        jobPostingId: input.jobPostingId,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone || "",
        cvFileName: file.name,
        cvFileUrl: fileUrl,
        cvMimeType: mimeType,
      },
    });

    return { ok: true as const, applicationId: id };
  }

  /**
   * Admin: List all job postings (including unpublished)
   */
  static async listAdminJobs() {
    return await prisma.jobPosting.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { postedAt: "desc" }],
    });
  }

  /**
   * Admin: Get single job posting by ID
   */
  static async getJobById(id: string) {
    return await prisma.jobPosting.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Admin: List applications for a job posting
   */
  static async listApplications(jobPostingId: string) {
    const job = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, deletedAt: null },
      select: { id: true },
    });
    if (!job) return null;

    return await prisma.jobApplication.findMany({
      where: { jobPostingId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Admin: Create job posting
   */
  static async createJob(adminId: string, input: CreateJobPostingInput) {
    const id = cuid();
    const baseSlug = input.slug ? slugify(input.slug) : slugify(input.title);
    const fallbackSlug = baseSlug || `job-${id.slice(-6)}`;

    let slug = fallbackSlug;
    let n = 0;
    while (true) {
      const existing = await prisma.jobPosting.findFirst({
        where: { slug, deletedAt: null },
        select: { id: true },
      });
      if (!existing) break;
      n += 1;
      slug = `${fallbackSlug}-${n}`;
    }

    return await prisma.jobPosting.create({
      data: {
        id,
        slug,
        title: input.title,
        department: input.department,
        location: input.location || "Riyadh, Saudi Arabia",
        employmentType: input.employmentType || "Full-time",
        description: input.description,
        requirements: input.requirements || [],
        benefits: input.benefits || [],
        isRemote: Boolean(input.isRemote),
        isPublished: Boolean(input.isPublished),
        sortOrder: input.sortOrder ?? 0,
        createdById: adminId,
      },
    });
  }

  /**
   * Admin: Patch job posting
   */
  static async patchJob(id: string, input: PatchJobPostingInput) {
    const existing = await prisma.jobPosting.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.department !== undefined) data.department = input.department;
    if (input.location !== undefined) data.location = input.location;
    if (input.employmentType !== undefined) data.employmentType = input.employmentType;
    if (input.description !== undefined) data.description = input.description;
    if (input.requirements !== undefined) data.requirements = input.requirements;
    if (input.benefits !== undefined) data.benefits = input.benefits;
    if (input.isRemote !== undefined) data.isRemote = input.isRemote;
    if (input.isPublished !== undefined) data.isPublished = input.isPublished;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

    if (input.slug !== undefined) {
      const base = slugify(input.slug);
      if (base && base !== existing.slug) {
        let slug = base;
        let n = 0;
        while (true) {
          const conflict = await prisma.jobPosting.findFirst({
            where: { slug, id: { not: id }, deletedAt: null },
            select: { id: true },
          });
          if (!conflict) break;
          n += 1;
          slug = `${base}-${n}`;
        }
        data.slug = slug;
      }
    }

    return await prisma.jobPosting.update({
      where: { id },
      data,
    });
  }

  /**
   * Admin: Soft delete job posting
   */
  static async deleteJob(id: string) {
    const existing = await prisma.jobPosting.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    const now = new Date();
    await prisma.jobPosting.update({
      where: { id },
      data: { deletedAt: now },
    });

    await prisma.jobApplication.updateMany({
      where: { jobPostingId: id },
      data: { deletedAt: now },
    });

    return existing;
  }
}
