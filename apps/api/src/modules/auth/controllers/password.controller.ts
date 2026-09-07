import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { requireAdmin } from "../services/admin-auth.service";
import { PasswordService } from "../services/password.service";

export class PasswordController {
  static async handleAdminChangePasswordWithCurrent(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const { admin, deny } = await requireAdmin(sql, env, request, "REVIEWER");
    if (deny) return deny;

    const body = (await request.json()) as { currentPassword?: string; newPassword?: string } | null;
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    const res = await PasswordService.changePasswordWithCurrent(
      sql,
      admin.id,
      currentPassword,
      newPassword,
      request.headers.get("X-Admin-Session")
    );

    if ("error" in res) {
      return json(env, request, { error: res.error }, res.status || 400);
    }

    return json(env, request, { ok: true });
  }

  static async handleAdminChangePasswordRequestOtp(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const { admin, deny } = await requireAdmin(sql, env, request, "REVIEWER");
    if (deny) return deny;

    const res = await PasswordService.requestChangePasswordOtp(sql, env, admin.id);
    if ("error" in res) {
      return json(env, request, { error: res.error }, res.status || 400);
    }

    return json(env, request, res);
  }

  static async handleAdminChangePasswordVerify(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const { admin, deny } = await requireAdmin(sql, env, request, "REVIEWER");
    if (deny) return deny;

    const body = (await request.json()) as { code?: string; newPassword?: string } | null;
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    const res = await PasswordService.verifyChangePasswordOtp(
      sql,
      admin.id,
      code,
      newPassword
    );

    if ("error" in res) {
      return json(env, request, { error: res.error }, res.status || 400);
    }

    return json(env, request, res);
  }
}

export const handleAdminChangePasswordWithCurrent =
  PasswordController.handleAdminChangePasswordWithCurrent;
export const handleAdminChangePasswordRequestOtp =
  PasswordController.handleAdminChangePasswordRequestOtp;
export const handleAdminChangePasswordVerify =
  PasswordController.handleAdminChangePasswordVerify;
