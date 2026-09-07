// ── Admin Roles & Constants ───────────────────────────────────────────────

export type AdminRoleName = "SUPER_ADMIN" | "ADMIN" | "REVIEWER";

export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14d
export const VENDOR_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7d
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 1000 * 60 * 15;

export const ROLE_RANK: Record<AdminRoleName, number> = {
  REVIEWER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

// ── Admin Identity & Results ───────────────────────────────────────────────

export type AdminIdentity = {
  id: string;
  email: string;
  name: string;
  role: AdminRoleName;
};

export type LoginResult =
  | { ok: true; adminId: string; admin: AdminIdentity }
  | { ok: false; reason: "invalid" | "locked" | "disabled"; retryAfterMs?: number };

export interface StaffListItem {
  id: string;
  email: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  role: AdminRoleName;
  isActive: boolean;
  lastLoginAt: string | null;
  failedAttempts: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AuditLogEntry = {
  adminId?: string | null;
  vendorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  actorName?: string;
  actorRole?: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
};

// ── Vendor Identity & Results ──────────────────────────────────────────────

export type VendorLoginResult =
  | {
      ok: true;
      vendorId: string;
      mustChangePassword: boolean;
      portalAccess: "HELD" | "RELEASED";
      vendor: { id: string; email: string; name: string };
    }
  | {
      ok: false;
      reason: "invalid" | "locked" | "disabled" | "held" | "incomplete";
      retryAfterMs?: number;
    };

export type VendorIdentity = {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  registrationId: string | null;
  portalAccess: "HELD" | "RELEASED";
  registrationComplete: boolean;
};
