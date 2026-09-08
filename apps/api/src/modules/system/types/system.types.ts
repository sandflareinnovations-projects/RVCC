import { z } from "@rvcc/schemas";

export const decisionRecipientSchema = z.object({
  to: z.string().email(),
  loginEmail: z.string().email().optional(),
  tempPassword: z.string().optional(),
});
export type DecisionRecipient = z.infer<typeof decisionRecipientSchema>;

export const notifyFailureSchema = z.object({
  to: z.string(),
  error: z.string(),
});

export const notifyOutcomeSchema = z.object({
  attempted: z.boolean(),
  sent: z.array(z.string()),
  failed: z.array(notifyFailureSchema),
  error: z.string().optional(),
});
export type NotifyOutcome = z.infer<typeof notifyOutcomeSchema>;

export const requirementMailOutcomeSchema = z.object({
  attempted: z.boolean(),
  sent: z.array(z.string()),
  failed: z.array(notifyFailureSchema),
});
export type RequirementMailOutcome = z.infer<typeof requirementMailOutcomeSchema>;

export const notificationItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  linkPath: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type NotificationItem = z.infer<typeof notificationItemSchema>;

export const vendorPerformanceItemSchema = z.object({
  email: z.string(),
  invited: z.number().int(),
  submitted: z.number().int(),
  won: z.number().int(),
});

export const recentQuoteMetricSchema = z.object({
  id: z.string(),
  newPrice: z.number(),
  submittedAt: z.string().nullable(),
  vendorName: z.string(),
  vendorEmail: z.string(),
  requirementId: z.string(),
  requirementTitle: z.string(),
});

export const dashboardMetricsSchema = z.object({
  pendingRegistrations: z.number().int(),
  activeVendors: z.number().int(),
  vendors: z.number().int(),
  publishedJobs: z.number().int(),
  totalJobs: z.number().int(),
  openCount: z.number().int(),
  closingSoon: z.number().int(),
  awaitingAward: z.number().int(),
  byStatus: z.record(z.number()),
  performance: z.array(vendorPerformanceItemSchema),
  recentQuotes: z.array(recentQuoteMetricSchema),
});
export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;

