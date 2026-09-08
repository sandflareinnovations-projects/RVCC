import { z } from "@rvcc/schemas";

export const createVendorInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  company: z.string().optional(),
  phone: z.string().optional(),
  industryIds: z.array(z.string()).optional(),
});
export type CreateVendorInput = z.infer<typeof createVendorInputSchema>;

export const normalisedVendorInputSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  company: z.string(),
  phone: z.string(),
  industryIds: z.array(z.string()),
});
export type NormalisedVendorInput = z.infer<typeof normalisedVendorInputSchema>;

export const registrationDetailSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    status: z.string(),
    referenceNumber: z.string().nullable(),
    company: z.record(z.unknown()).nullable(),
    contacts: z.array(z.record(z.unknown())),
    addresses: z.array(z.record(z.unknown())),
    classifications: z.array(z.record(z.unknown())),
    bankAccounts: z.array(z.record(z.unknown())),
    questionnaire: z.array(z.record(z.unknown())),
    attachments: z.array(z.record(z.unknown())),
    vendorUsers: z.array(z.record(z.unknown())),
    reviewedBy: z.object({ name: z.string(), email: z.string() }).nullable(),
  })
  .passthrough();
export type RegistrationDetail = z.infer<typeof registrationDetailSchema>;

