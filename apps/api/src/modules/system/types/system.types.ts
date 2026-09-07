export type DecisionRecipient = {
  to: string;
  loginEmail?: string;
  tempPassword?: string;
};

export type NotifyOutcome = {
  attempted: boolean;
  sent: string[];
  failed: { to: string; error: string }[];
  error?: string;
};

export type RequirementMailOutcome = {
  attempted: boolean;
  sent: string[];
  failed: { to: string; error: string }[];
};

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  linkPath: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  pendingRegistrations: number;
  activeVendors: number;
  vendors: number;
  publishedJobs: number;
  totalJobs: number;
  openCount: number;
  closingSoon: number;
  awaitingAward: number;
  byStatus: Record<string, number>;
  performance: {
    email: string;
    invited: number;
    submitted: number;
    won: number;
  }[];
  recentQuotes: {
    id: string;
    newPrice: number;
    submittedAt: string | null;
    vendorName: string;
    vendorEmail: string;
    requirementId: string;
    requirementTitle: string;
  }[];
}
