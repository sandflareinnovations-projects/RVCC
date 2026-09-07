import { Hono } from "hono";
import type { Env } from "../../config/env";
import {
  handleDashboard,
  handleIndustriesList,
} from "./controllers/dashboard.admin.controller";
import {
  handleAdminNotificationsGet,
  handleAdminNotificationsMarkRead,
  handleAdminPushSubscribe,
  handleAdminPushUnsubscribe,
} from "./controllers/notification.admin.controller";

export function createSystemAdminRouter(env: Env) {
  const router = new Hono();

  // Dashboard & system metrics
  router.get("/dashboard", (c) => handleDashboard(null, env, c.req.raw));
  router.get("/industries", (c) => handleIndustriesList(null, env, c.req.raw));

  // Admin notifications
  router.get("/notifications", (c) => handleAdminNotificationsGet(null, env, c.req.raw));
  router.post("/notifications/read", (c) =>
    handleAdminNotificationsMarkRead(null, env, c.req.raw)
  );

  // Push subscriptions
  router.post("/push/subscribe", (c) => handleAdminPushSubscribe(null, env, c.req.raw));
  router.post("/push/unsubscribe", (c) => handleAdminPushUnsubscribe(null, env, c.req.raw));

  return router;
}
