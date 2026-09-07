import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { requireAdmin } from "../../auth";
import { ContentMediaService } from "./media.service";

export async function handleAdminContentMediaUpload(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(env, request, { error: "Expected multipart form data" }, 400);
  }

  const file = form.get("file");
  const folder = String(form.get("folder") ?? "hero").trim();
  const label = String(form.get("label") ?? "image").trim();

  if (!(file instanceof File)) {
    return json(env, request, { error: "File is required." }, 400);
  }

  const result = await ContentMediaService.uploadContentMedia(env, file, folder, label);
  if (result.error) {
    return json(env, request, { error: result.error }, result.status || 400);
  }

  return json(env, request, { ok: true, fileUrl: result.fileUrl, key: result.key });
}

export async function handlePublicMediaRequest(
  request: Request,
  env: Env,
  id: string
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    const file = await ContentMediaService.getPublicMedia(id);
    if (!file) {
      return json(env, request, { error: "Media file not found or inactive" }, 404);
    }

    return json(
      env,
      request,
      { ok: true, file },
      200,
      { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" }
    );
  } catch (err) {
    console.error("[public/media]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}
