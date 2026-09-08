import { z } from "zod";
import { cuidSchema, emailSchema, sanitizedStringSchema } from "./common";

/**
  * Career / Job Posting Schemas
  */
export const jobPostingDTOSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  department: z.string(),
  location: z.string(),
  employmentType: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  benefits: z.array(z.string()),
  isRemote: z.boolean(),
  isPublished: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type JobPostingDTO = z.infer<typeof jobPostingDTOSchema>;

export const createJobPostingSchema = z.object({
  slug: sanitizedStringSchema(0, 100).optional(),
  title: sanitizedStringSchema(1, 200),
  department: sanitizedStringSchema(1, 100),
  location: sanitizedStringSchema(0, 100).optional().default("Riyadh, Saudi Arabia"),
  employmentType: sanitizedStringSchema(0, 50).optional().default("Full-time"),
  description: sanitizedStringSchema(1, 10000),
  requirements: z.array(sanitizedStringSchema(1, 500)).optional().default([]),
  benefits: z.array(sanitizedStringSchema(1, 500)).optional().default([]),
  isRemote: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().optional().default(0),
});
export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;

export const patchJobPostingSchema = createJobPostingSchema.partial();
export type PatchJobPostingInput = z.infer<typeof patchJobPostingSchema>;

/**
  * Job Application Schemas
  */
export const jobApplicationInputSchema = z.object({
  jobPostingId: cuidSchema.or(z.string().min(1, "jobPostingId is required")),
  fullName: sanitizedStringSchema(1, 120),
  email: emailSchema,
  phone: sanitizedStringSchema(0, 30).optional().default(""),
});
export type JobApplicationInput = z.infer<typeof jobApplicationInputSchema>;

export const jobApplicationDTOSchema = z.object({
  id: z.string(),
  jobPostingId: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  resumeUrl: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type JobApplicationDTO = z.infer<typeof jobApplicationDTOSchema>;
