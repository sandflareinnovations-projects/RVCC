import { z } from "@rvcc/schemas";

export const purchaseRequestItemInputSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.string().optional().default("General"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unit: z.string().optional().default("pcs"),
  estimatedUnitPrice: z.number().nonnegative("Unit price cannot be negative").default(0),
  preferredVendor: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const purchaseRequestAttachmentInputSchema = z.object({
  name: z.string().min(1, "Attachment name is required"),
  url: z.string().min(1, "Attachment url is required"),
  sizeBytes: z.number().int().nonnegative().optional().default(0),
  mimeType: z.string().optional().default("application/pdf"),
});

export const createPurchaseRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  department: z.string().min(1, "Department is required"),
  requesterName: z.string().min(1, "Requester name is required"),
  requesterEmail: z.string().email().nullable().optional(),
  description: z.string().optional().default(""),
  priority: z.enum(["low", "medium", "high", "urgent", "LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  requiredByDate: z.string().min(1, "Valid required by date is required"),
  currency: z.enum(["SAR", "USD", "AED", "INR", "EUR"]).default("SAR"),
  costCenter: z.string().nullable().optional(),
  items: z.array(purchaseRequestItemInputSchema).min(1, "At least one line item is required"),
  attachments: z.array(purchaseRequestAttachmentInputSchema).optional().default([]),
});

export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;

export const reviewPurchaseRequestSchema = z.object({
  status: z.enum([
    "draft",
    "submitted",
    "pending",
    "under_review",
    "approved",
    "rejected",
    "revision_requested",
  ]),
  note: z.string().nullable().optional(),
  adminNotes: z.string().optional(),
});

export type ReviewPurchaseRequestInput = z.infer<typeof reviewPurchaseRequestSchema>;
