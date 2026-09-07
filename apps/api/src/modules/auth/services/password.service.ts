import type { Env } from "../../../config/env";
import { hashPassword, verifyPassword } from "../../../lib/password";
import { prisma } from "../../../lib/prisma";
import { cuid, hashSha256 } from "../../../lib/sql";
import { sendAdminPasswordChangeOtp, smtpConfigured } from "../../mail/mail";
import { writeAudit } from "./admin-auth.service";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_PER_HOUR = 5;

export class PasswordService {
  /**
   * Reset password directly with current password (no OTP).
   */
  static async changePasswordWithCurrent(
    sql: unknown,
    adminId: string,
    currentPassword: string,
    newPassword: string,
    currentSessionToken?: string | null
  ) {
    if (!currentPassword) {
      return { error: "Current password is required.", status: 400 };
    }
    if (!newPassword || newPassword.length < 8) {
      return { error: "New password must be at least 8 characters.", status: 400 };
    }
    if (currentPassword === newPassword) {
      return { error: "New password must be different from current password.", status: 400 };
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!adminUser) {
      return { error: "Account not found.", status: 404 };
    }

    if (!(await verifyPassword(currentPassword, adminUser.passwordHash))) {
      return { error: "Incorrect current password.", status: 401 };
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    if (currentSessionToken) {
      const tokenHash = await hashSha256(currentSessionToken);
      await prisma.adminSession.updateMany({
        where: {
          adminId,
          tokenHash: { not: tokenHash },
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } else {
      await prisma.adminSession.updateMany({
        where: {
          adminId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    await writeAudit(sql, {
      adminId,
      action: "admin.password_changed",
      entityType: "AdminUser",
      entityId: adminId,
      metadata: { method: "current_password" },
    });

    return { ok: true };
  }

  /**
   * Send OTP to admin's email (forgot password — no current password needed).
   */
  static async requestChangePasswordOtp(sql: unknown, env: Env, adminId: string) {
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, email: true },
    });

    if (!adminUser) {
      return { error: "Account not found.", status: 404 };
    }

    if (!smtpConfigured(env)) {
      return { error: "Mail service unavailable.", status: 503 };
    }

    const count = await prisma.adminOtp.count({
      where: {
        adminId,
        action: "PASSWORD_CHANGE",
        createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    if (count >= OTP_MAX_PER_HOUR) {
      return { error: "Too many requests. Try again later.", status: 429 };
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await hashSha256(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.adminOtp.updateMany({
      where: {
        adminId,
        action: "PASSWORD_CHANGE",
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    await prisma.adminOtp.create({
      data: {
        id: cuid(),
        adminId,
        action: "PASSWORD_CHANGE",
        codeHash,
        expiresAt,
      },
    });

    try {
      await sendAdminPasswordChangeOtp(env, adminUser.email, code, 10);
    } catch (err) {
      console.error("[admin] change-password OTP mail failed", err);
      return { error: "Unable to send verification code.", status: 500 };
    }

    await writeAudit(sql, {
      adminId,
      action: "admin.password_change_requested",
      entityType: "AdminUser",
      entityId: adminId,
      metadata: { email: adminUser.email, method: "otp" },
    });

    return { ok: true, expiresInMinutes: 10 };
  }

  /**
   * Verify OTP and change password.
   */
  static async verifyChangePasswordOtp(
    sql: unknown,
    adminId: string,
    code: string,
    newPassword: string
  ) {
    if (!code || !/^\d{6}$/.test(code)) {
      return { error: "A 6-digit verification code is required.", status: 400 };
    }

    if (!newPassword || newPassword.length < 8) {
      return { error: "New password must be at least 8 characters.", status: 400 };
    }

    const codeHash = await hashSha256(code);
    const otp = await prisma.adminOtp.findFirst({
      where: {
        adminId,
        action: "PASSWORD_CHANGE",
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return { error: "No valid verification code found. Request a new one.", status: 404 };
    }

    const storedHash = otp.codeHash;
    if (storedHash.length !== codeHash.length || storedHash !== codeHash) {
      return { error: "Invalid verification code.", status: 401 };
    }

    await prisma.adminOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    const passwordHash = await hashPassword(newPassword);
    await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.adminSession.updateMany({
      where: {
        adminId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await writeAudit(sql, {
      adminId,
      action: "admin.password_reset_via_otp",
      entityType: "AdminUser",
      entityId: adminId,
      metadata: { method: "otp" },
    });

    return {
      ok: true,
      message: "Password updated successfully. Please sign in again.",
    };
  }
}
