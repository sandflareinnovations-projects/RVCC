import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { DocumentsService } from "../services/documents.service";

export async function handlePublicDocumentsRequest(
  request: Request,
  env: Env,
  slug?: string
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    // ── Single document by slug ──────────────────────────────────────────────
    if (slug) {
      const document = await DocumentsService.getDocumentBySlug(slug, { publishedOnly: true });
      if (!document) {
        return json(env, request, { error: "Document not found" }, 404);
      }

      return json(
        env,
        request,
        { ok: true, document },
        200,
        { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=86400" }
      );
    }

    // ── List all published documents ─────────────────────────────────────────
    const documents = await DocumentsService.listDocuments({ publishedOnly: true });
    return json(
      env,
      request,
      { ok: true, documents },
      200,
      { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=86400" }
    );
  } catch (err) {
    console.error("[public/documents]", err);
    return json(env, request, { error: "Failed to retrieve documents" }, 500);
  }
}
