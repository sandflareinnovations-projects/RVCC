import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { CareersService } from "../services/careers.service";

export async function handlePublicCareersList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const jobs = await CareersService.listPublicJobs();
  return json(env, request, { jobs }, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
}

export async function handleCareerApply(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(env, request, { error: "Expected multipart form data" }, 400);
  }

  const jobPostingId = String(form.get("jobPostingId") ?? "").trim();
  const fullName = String(form.get("fullName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const phone = String(form.get("phone") ?? "").trim();
  const cv = form.get("cv");

  if (!jobPostingId) return json(env, request, { error: "jobPostingId is required" }, 400);
  if (!fullName) return json(env, request, { error: "Full name is required" }, 400);
  if (!email.includes("@")) return json(env, request, { error: "Valid email is required" }, 400);
  if (!(cv instanceof File)) return json(env, request, { error: "CV file is required" }, 400);

  const result = await CareersService.applyForJob(env, cv, {
    jobPostingId,
    fullName,
    email,
    phone,
  });

  if ("error" in result) {
    return json(env, request, { error: result.error }, result.status);
  }

  return json(env, request, { ok: true, applicationId: result.applicationId });
}

export async function handlePublicCareersRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "POST" && path.endsWith("/apply")) {
      const { enforceRateLimit } = await import("../../../lib/rate-limit");
      const limited = await enforceRateLimit(request, env, "public:career-apply", {
        limit: 10,
        windowSeconds: 600,
      });
      if (limited) return limited;
      return await handleCareerApply(null, env, request);
    }
    if (request.method === "GET") {
      return await handlePublicCareersList(null, env, request);
    }
    return json(env, request, { error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("[careers]", err);
    return json(env, request, { error: "Internal error" }, 500);
  }
}
