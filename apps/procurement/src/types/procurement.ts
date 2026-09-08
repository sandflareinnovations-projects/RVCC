import type {
  ProcurementStatsDTO,
  PurchaseRequestAttachmentDTO,
  PurchaseRequestAuditDTO,
  PurchaseRequestDetailDTO,
  PurchaseRequestItemDTO,
  PurchaseRequestListItemDTO,
} from "@rvcc/schemas";

export type RequestStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "revision_requested";

export type PriorityLevel = "low" | "medium" | "high" | "urgent";

export type RequestItem = PurchaseRequestItemDTO;
export type Attachment = PurchaseRequestAttachmentDTO;
export type AuditLogEntry = PurchaseRequestAuditDTO;
export type PurchaseRequest = Omit<PurchaseRequestDetailDTO, "priority" | "status"> & {
  priority: PriorityLevel;
  status: RequestStatus;
  itemCount?: number;
  rejectionReason?: string;
};
export type ProcurementStats = ProcurementStatsDTO;

export type {
  ProcurementStatsDTO,
  PurchaseRequestAttachmentDTO,
  PurchaseRequestAuditDTO,
  PurchaseRequestDetailDTO,
  PurchaseRequestItemDTO,
  PurchaseRequestListItemDTO,
};

