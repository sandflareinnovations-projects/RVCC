export type ProcurementPriorityType = "low" | "medium" | "high" | "urgent";
export type ProcurementStatusType =
  | "draft"
  | "submitted"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "revision_requested";

export interface PurchaseRequestItemDTO {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  totalPrice: number;
  preferredVendor?: string | null;
  notes?: string | null;
}

export interface PurchaseRequestAttachmentDTO {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface PurchaseRequestAuditDTO {
  id: string;
  action: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  note?: string | null;
  previousStatus?: string;
  newStatus?: string;
}

export interface PurchaseRequestDetailDTO {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  department: string;
  requesterName: string;
  requesterEmail?: string | null;
  priority: string;
  status: string;
  requiredByDate: string;
  currency: string;
  totalEstimatedAmount: number;
  costCenter?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseRequestItemDTO[];
  attachments: PurchaseRequestAttachmentDTO[];
  auditTrail: PurchaseRequestAuditDTO[];
}
