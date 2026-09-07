import { Hono } from "hono";
import type { Env } from "../../config/env";
import { handlePublicCareersRequest } from "./careers";

export function createPublicRouter(env: Env) {
  const router = new Hono();

  router.all("/careers", (c) => handlePublicCareersRequest(c.req.raw, env));
  router.all("/careers/apply", (c) => handlePublicCareersRequest(c.req.raw, env));

  router.all("/hero-slides", async (c) => {
    const { handlePublicHeroRequest } = await import("./hero");
    return handlePublicHeroRequest(c.req.raw, env);
  });

  router.all("/clients", async (c) => {
    const { handlePublicClientsRequest } = await import("./clients");
    return handlePublicClientsRequest(c.req.raw, env);
  });

  router.all("/sister-companies", async (c) => {
    const { handlePublicSisterCompaniesRequest } = await import("./companies");
    return handlePublicSisterCompaniesRequest(c.req.raw, env);
  });

  router.all("/projects", async (c) => {
    const { handlePublicProjectsRequest } = await import("./projects");
    return handlePublicProjectsRequest(c.req.raw, env);
  });
  router.all("/projects/*", async (c) => {
    const { handlePublicProjectsRequest } = await import("./projects");
    return handlePublicProjectsRequest(c.req.raw, env);
  });

  router.all("/services", async (c) => {
    const { handlePublicServicesRequest } = await import("./services");
    return handlePublicServicesRequest(c.req.raw, env);
  });
  router.all("/services/*", async (c) => {
    const { handlePublicServicesRequest } = await import("./services");
    return handlePublicServicesRequest(c.req.raw, env);
  });

  router.all("/gallery", async (c) => {
    const { handlePublicGalleryRequest } = await import("./gallery");
    return handlePublicGalleryRequest(c.req.raw, env);
  });

  router.all("/media/:id", async (c) => {
    const { handlePublicMediaRequest } = await import("./media");
    return handlePublicMediaRequest(c.req.raw, env, c.req.param("id"));
  });

  router.all("/documents", async (c) => {
    const { handlePublicDocumentsRequest } = await import("./documents");
    return handlePublicDocumentsRequest(c.req.raw, env);
  });
  router.all("/documents/*", async (c) => {
    const { handlePublicDocumentsRequest } = await import("./documents");
    const slug = c.req.path.replace(/^\/documents\/?/, "");
    return handlePublicDocumentsRequest(c.req.raw, env, slug);
  });

  return router;
}
