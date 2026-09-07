import { z } from "@rvcc/schemas";

export const createJobPostingSchema = z.object({
  slug: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  department: z.string().min(1, "Department is required"),
  location: z.string().optional().default("Riyadh, Saudi Arabia"),
  employmentType: z.string().optional().default("Full-time"),
  description: z.string().min(1, "Description is required"),
  requirements: z.array(z.string()).optional().default([]),
  benefits: z.array(z.string()).optional().default([]),
  isRemote: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
});

export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;

export const patchJobPostingSchema = createJobPostingSchema.partial();
export type PatchJobPostingInput = z.infer<typeof patchJobPostingSchema>;

export const jobApplicationInputSchema = z.object({
  jobPostingId: z.string().min(1, "jobPostingId is required"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().default(""),
});

export type JobApplicationInput = z.infer<typeof jobApplicationInputSchema>;
