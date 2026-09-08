import {
  companyDocumentSchema,
  type CompanyDocumentDTO,
  type DocumentCategory,
  z,
} from "@rvcc/schemas";

export const serializedDocumentSchema = companyDocumentSchema.extend({
  category: z.string(),
  isPublished: z.boolean().optional(),
});

export type SerializedDocument = z.infer<typeof serializedDocumentSchema>;
export type { CompanyDocumentDTO, DocumentCategory };

