import { randomBytes } from "node:crypto";
import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { hashPassword, verifyPassword } from "../../../lib/password";
import { prisma } from "../../../lib/prisma";
import { hashSha256 } from "../../../lib/sql";
import {
  LOCKOUT_MS,
  MAX_FAILED_ATTEMPTS,
  VENDOR_SESSION_TTL_MS,
  type VendorIdentity,
  type VendorLoginResult,
} from "../types/auth.types";

function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export class VendorAuthService {
  /** Same shape and same anti-enumeration behaviour as the admin login. */
  static async attemptVendorLogin(
    _sql: unknown,
    email: string,
    password: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<VendorLoginResult> {
    const normalized = email.trim().toLowerCase();
    const ip = meta?.ipAddress || "127.0.0.1";
    const userAgent = meta?.userAgent || "";

    const vendor = await prisma.vendorUser.findUnique({
      where: { email: normalized },
    });

    if (!vendor) {
      await hashPassword(password);
      return { ok: false, reason: "invalid" };
    }

    if (vendor.lockedUntil && new Date(vendor.lockedUntil) > new Date()) {
      try {
        await prisma.vendorLoginHistory.create({
          data: {
            vendorId: vendor.id,
            ipAddress: ip,
            userAgent,
            status: "FAILED",
            failureReason: "ACCOUNT_LOCKED",
          },
        });
      } catch {}

      return {
        ok: false,
        reason: "locked",
        retryAfterMs: new Date(vendor.lockedUntil).getTime() - Date.now(),
      };
    }

    if (!vendor.isActive) {
      try {
        await prisma.vendorLoginHistory.create({
          data: {
            vendorId: vendor.id,
            ipAddress: ip,
            userAgent,
            status: "FAILED",
            failureReason: "ACCOUNT_DISABLED",
          },
        });
      } catch {}

      return { ok: false, reason: "disabled" };
    }

    if (!(await verifyPassword(password, vendor.passwordHash))) {
      const failedAttempts = Number(vendor.failedAttempts) + 1;
      const lock = failedAttempts >= MAX_FAILED_ATTEMPTS;

      await prisma.vendorUser.update({
        where: { id: vendor.id },
        data: {
          failedAttempts: lock ? 0 : failedAttempts,
          lockedUntil: lock ? new Date(Date.now() + LOCKOUT_MS) : null,
        },
      });

      try {
        await prisma.vendorLoginHistory.create({
          data: {
            vendorId: vendor.id,
            ipAddress: ip,
            userAgent,
            status: "FAILED",
            failureReason: "INVALID_PASSWORD",
          },
        });
      } catch {}

      return lock
        ? { ok: false, reason: "locked", retryAfterMs: LOCKOUT_MS }
        : { ok: false, reason: "invalid" };
    }

    const portalAccess = vendor.portalAccess === "RELEASED" ? "RELEASED" : "HELD";
    if (portalAccess === "HELD") {
      return { ok: false, reason: "held" };
    }

    await prisma.vendorUser.update({
      where: { id: vendor.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    try {
      await prisma.vendorLoginHistory.create({
        data: {
          vendorId: vendor.id,
          ipAddress: ip,
          userAgent,
          status: "SUCCESS",
          failureReason: null,
        },
      });
    } catch {}

    return {
      ok: true,
      vendorId: vendor.id,
      mustChangePassword: Boolean(vendor.mustChangePassword),
      portalAccess: "RELEASED",
      vendor: {
        id: vendor.id,
        email: vendor.email,
        name: vendor.name ?? "",
      },
    };
  }

  static async createVendorSession(
    _sql: unknown,
    vendorId: string,
    userAgent = ""
  ): Promise<string> {
    const token = generateSessionToken();
    const tokenHash = await hashSha256(token);
    const expiresAt = new Date(Date.now() + VENDOR_SESSION_TTL_MS);

    await prisma.vendorSession.create({
      data: {
        tokenHash,
        vendorId,
        userAgent: userAgent.slice(0, 255),
        expiresAt,
      },
    });

    return token;
  }

  static async getVendorFromSession(
    _sql: unknown,
    token: string | null | undefined
  ): Promise<VendorIdentity | null> {
    if (!token) return null;

    try {
      const tokenHash = await hashSha256(token);
      const session = await prisma.vendorSession.findUnique({
        where: { tokenHash },
        include: {
          vendor: {
            include: { registration: true },
          },
        },
      });

      if (!session) return null;
      if (session.revokedAt) return null;
      if (new Date(session.expiresAt) < new Date()) return null;
      if (!session.vendor || !session.vendor.isActive) return null;

      const regComplete = session.vendor.registration
        ? Boolean(session.vendor.registration.registrationComplete)
        : true;

      return {
        id: session.vendor.id,
        email: session.vendor.email,
        name: session.vendor.name,
        mustChangePassword: Boolean(session.vendor.mustChangePassword),
        registrationId: session.vendor.registrationId,
        portalAccess: session.vendor.portalAccess,
        registrationComplete: regComplete,
      };
    } catch (err) {
      console.error("[vendor session] lookup failed", err);
      return null;
    }
  }

  static async revokeVendorSession(
    _sql: unknown,
    token: string | null | undefined
  ): Promise<void> {
    if (!token) return;
    try {
      const tokenHash = await hashSha256(token);
      await prisma.vendorSession.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      /* non-fatal */
    }
  }

  static async requireVendor(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<{ vendor: VendorIdentity; deny: null } | { vendor: null; deny: Response }> {
    const token = request.headers.get("X-Vendor-Session");
    if (!token) {
      return {
        vendor: null,
        deny: json(env, request, { error: "Not signed in" }, 401),
      };
    }

    const vendor = await VendorAuthService.getVendorFromSession(sql, token);
    if (!vendor) {
      return {
        vendor: null,
        deny: json(env, request, { error: "Session expired or invalid" }, 401),
      };
    }

    if (vendor.portalAccess === "HELD") {
      return {
        vendor: null,
        deny: json(env, request, { error: "Access held", code: "PORTAL_ACCESS_HELD" }, 403),
      };
    }

    return { vendor, deny: null };
  }
}

export const attemptVendorLogin = VendorAuthService.attemptVendorLogin;
export const createVendorSession = VendorAuthService.createVendorSession;
export const getVendorFromSession = VendorAuthService.getVendorFromSession;
export const revokeVendorSession = VendorAuthService.revokeVendorSession;
export const requireVendor = VendorAuthService.requireVendor;
