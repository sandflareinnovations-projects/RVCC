import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import type { Env } from "./config/env";

const mockEnv: Env = {
  DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
  ALLOWED_ORIGINS: "https://rvcc-admin.vercel.app,https://rvcc-vendor.vercel.app",
  VENDOR_PORTAL_URL: "https://rvcc-vendor.vercel.app",
  ADMIN_PORTAL_URL: "https://rvcc-admin.vercel.app",
  PORT: 4000,
  NODE_ENV: "test",
};

describe("QA Integration Tests: Hono API Routing & Security Middleware", () => {
  const app = createApp(mockEnv);

  describe("CORS & Preflight Handling", () => {
    it("should respond with 204 to OPTIONS requests with appropriate CORS headers", async () => {
      const res = await app.request("/health", {
        method: "OPTIONS",
        headers: { Origin: "https://rvcc-admin.vercel.app" },
      });
      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://rvcc-admin.vercel.app");
      expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    });

    it("should reject disallowed origins in CORS", async () => {
      const res = await app.request("/health", {
        method: "OPTIONS",
        headers: { Origin: "https://evil-attacker.com" },
      });
      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("null");
    });
  });

  describe("Method Not Allowed (405) Enforcement", () => {
    it("should return 405 when sending POST to read-only /sister-companies", async () => {
      const res = await app.request("/sister-companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Hacked" }),
      });
      expect(res.status).toBe(405);
      const data = await res.json();
      expect(data.error).toBe("Method not allowed");
    });

    it("should return 405 when sending DELETE to /services", async () => {
      const res = await app.request("/services", {
        method: "DELETE",
      });
      expect(res.status).toBe(405);
      const data = await res.json();
      expect(data.error).toBe("Method not allowed");
    });
  });

  describe("Authentication & Route Protection (401/403/404)", () => {
    it("should block unauthenticated access to /admin/auth/me with 401", async () => {
      const res = await app.request("/admin/auth/me", {
        method: "GET",
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Not signed in.");
    });

    it("should block unauthenticated access to /admin/bidding/fx-sync with 401", async () => {
      const res = await app.request("/admin/bidding/fx-sync", {
        method: "POST",
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Not signed in.");
    });

    it("should block unauthenticated access to /vendor/dashboard with 401", async () => {
      const res = await app.request("/vendor/dashboard", {
        method: "GET",
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Not signed in.");
    });

    it("should return 404 for nonexistent routes with standard JSON error", async () => {
      const res = await app.request("/non-existent-endpoint-xyz", {
        method: "GET",
      });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Not Found");
    });
  });
});
