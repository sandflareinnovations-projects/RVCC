export type AwardableQuote = {
  id: string;
  newPrice: string;
  vendorEmail: string;
};

export type CreateRequirementInput = {
  scopeOfWork: string;
  project: string;
  sellingPrice?: string | null;
  currency?: string;
  closesAt: string;
  /** Vendor ids. "Agent" at RVCC means vendor, so there is only one audience. */
  vendorUserIds: string[];
};
