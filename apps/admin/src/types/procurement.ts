import type {
  ProcurementPriorityClientEnum,
  ProcurementStatsDTO,
  ProcurementStatusClientEnum,
  PurchaseRequestAttachmentDTO,
  PurchaseRequestAuditDTO,
  PurchaseRequestDetailDTO,
  PurchaseRequestItemDTO,
  PurchaseRequestListItemDTO,
} from "@rvcc/schemas";

export type RequestStatus = ProcurementStatusClientEnum;
export type PriorityLevel = ProcurementPriorityClientEnum;

export type RequestItem = PurchaseRequestItemDTO;
export type Attachment = PurchaseRequestAttachmentDTO;
export type AuditLogEntry = PurchaseRequestAuditDTO;

export type PurchaseRequest = Omit<PurchaseRequestDetailDTO, "priority" | "status"> & {
  priority: PriorityLevel;
  status: RequestStatus;
  itemCount?: number;
  rejectionReason?: string;
  assignedBuyer?: string;
};

export type ProcurementStats = ProcurementStatsDTO;

export type {
  ProcurementPriorityClientEnum,
  ProcurementStatsDTO,
  ProcurementStatusClientEnum,
  PurchaseRequestAttachmentDTO,
  PurchaseRequestAuditDTO,
  PurchaseRequestDetailDTO,
  PurchaseRequestItemDTO,
  PurchaseRequestListItemDTO,
};

