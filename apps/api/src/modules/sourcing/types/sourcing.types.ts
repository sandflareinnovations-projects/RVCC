import { z } from "@rvcc/schemas";

export const awardableQuoteSchema = z.object({
  id: z.string(),
  newPrice: z.string(),
  vendorEmail: z.string().email(),
});
export type AwardableQuote = z.infer<typeof awardableQuoteSchema>;

export const createRequirementInputSchema = z.object({
  scopeOfWork: z.string().min(1),
  project: z.string().min(1),
  sellingPrice: z.string().nullable().optional(),
  currency: z.string().optional(),
  closesAt: z.string(),
  /** Vendor ids. "Agent" at RVCC means vendor, so there is only one audience. */
  vendorUserIds: z.array(z.string()),
});
export type CreateRequirementInput = z.infer<typeof createRequirementInputSchema>;

