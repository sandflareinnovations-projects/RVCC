export type RegistrationDetail = Record<string, unknown> & {
  id: string;
  email: string;
  status: string;
  referenceNumber: string | null;
  company: Record<string, unknown> | null;
  contacts: Array<Record<string, unknown>>;
  addresses: Array<Record<string, unknown>>;
  classifications: Array<Record<string, unknown>>;
  bankAccounts: Array<Record<string, unknown>>;
  questionnaire: Array<Record<string, unknown>>;
  attachments: Array<Record<string, unknown>>;
  vendorUsers: Array<Record<string, unknown>>;
  reviewedBy: { name: string; email: string } | null;
};

export type CreateVendorInput = {
  email: string;
  name: string;
  company?: string;
  phone?: string;
  industryIds?: string[];
};

export type NormalisedVendorInput = {
  email: string;
  name: string;
  company: string;
  phone: string;
  industryIds: string[];
};
