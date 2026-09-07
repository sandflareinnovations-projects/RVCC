import { z } from "@rvcc/schemas";

export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  color: z.string().optional().default("indigo"),
  parentId: z.string().nullable().optional(),
});
export type CreateFolderInput = z.infer<typeof createFolderSchema>;

export const updateFolderSchema = z.object({
  name: z.string().min(1, "Folder name cannot be empty").optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
});
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;

export const updateFileSchema = z.object({
  name: z.string().min(1, "File name cannot be empty").optional(),
  description: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
