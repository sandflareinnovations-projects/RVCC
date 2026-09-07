import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import {
  attemptAdminLogin,
  createAdminSession,
  requireAdmin,
  revokeAdminSession,
  writeAudit,
} from "../services/admin-auth.service";

export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export class AdminAuthController {
  static async handleLogin(sql: unknown, env: Env, request: Request): Promise<Response> {
    const body = (await readJson(request)) as { email?: string; password?: string } | null;
    if (!body) return json(env, request, { error: "Invalid request" }, 400);

    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email.includes("@") || !password) {
      return json(env, request, { error: "Email and password are required" }, 400);
    }

    const result = await attemptAdminLogin(sql, email, password);

    if (!result.ok) {
      if (result.reason === "locked") {
        const mins = Math.ceil((result.retryAfterMs ?? 0) / 60000);
        return json(
          env,
          request,
          {
            error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
          },
          429
        );
      }
      if (result.reason === "disabled") {
        return json(env, request, { error: "This account has been disabled." }, 403);
      }
      return json(env, request, { error: "Incorrect email or password." }, 401);
    }

    const token = await createAdminSession(
      sql,
      result.adminId,
      request.headers.get("user-agent") ?? ""
    );
    await writeAudit(sql, {
      adminId: result.adminId,
      action: "admin.login",
      entityType: "AdminUser",
      entityId: result.adminId,
    });

    return json(env, request, { ok: true, token, admin: result.admin });
  }

  static async handleLogout(sql: unknown, env: Env, request: Request): Promise<Response> {
    await revokeAdminSession(sql, request.headers.get("X-Admin-Session"));
    return json(env, request, { ok: true });
  }

  static async handleMe(sql: unknown, env: Env, request: Request): Promise<Response> {
    const { admin, deny } = await requireAdmin(sql, env, request, "REVIEWER");
    if (deny) return deny;
    return json(env, request, {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  }
}

export const handleLogin = AdminAuthController.handleLogin;
export const handleLogout = AdminAuthController.handleLogout;
export const handleMe = AdminAuthController.handleMe;
