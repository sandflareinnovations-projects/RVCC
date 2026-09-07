import { describe, expect, it } from "vitest";
import { enforceRateLimit } from "../../src/lib/rate-limit";
import type { Env } from "../../src/config/env";

const mockEnv: Env = {
  DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
  ALLOWED_ORIGINS: "*",
  VENDOR_PORTAL_URL: "https://rvcc-vendor.vercel.app",
  PORT: 4000,
  NODE_ENV: "test",
};

describe("QA Security & Resilience Tests: IP Rate Limiting Engine", () => {
  it("should allow requests within the specified limit", async () => {
    const actionKey = `test-action-${Date.now()}`;
    const req = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });

    // Limit is 3 requests per 60 seconds
    const res1 = await enforceRateLimit(req, mockEnv, actionKey, { limit: 3, windowSeconds: 60 });
    const res2 = await enforceRateLimit(req, mockEnv, actionKey, { limit: 3, windowSeconds: 60 });
    const res3 = await enforceRateLimit(req, mockEnv, actionKey, { limit: 3, windowSeconds: 60 });

    expect(res1).toBeNull();
    expect(res2).toBeNull();
    expect(res3).toBeNull();
  });

  it("should block request N + 1 with HTTP 429 and rate-limit headers", async () => {
    const actionKey = `test-blocked-${Date.now()}`;
    const req = new Request("http://localhost/test", {
      headers: { "cf-connecting-ip": "198.51.100.5" },
    });

    // Limit 2 requests
    await enforceRateLimit(req, mockEnv, actionKey, { limit: 2, windowSeconds: 30 });
    await enforceRateLimit(req, mockEnv, actionKey, { limit: 2, windowSeconds: 30 });

    // Third request must be blocked
    const blockedRes = await enforceRateLimit(req, mockEnv, actionKey, { limit: 2, windowSeconds: 30 });
    expect(blockedRes).not.toBeNull();
    expect(blockedRes?.status).toBe(429);

    const data = await blockedRes!.json();
    expect(data.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(blockedRes?.headers.get("Retry-After")).toBe("30");
    expect(blockedRes?.headers.get("X-RateLimit-Limit")).toBe("2");
    expect(blockedRes?.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("should isolate rate limits across different IP addresses", async () => {
    const actionKey = `test-isolate-${Date.now()}`;
    const ipA = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    const ipB = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "10.0.0.2" },
    });

    // Exhaust limit for IP A (limit 1)
    await enforceRateLimit(ipA, mockEnv, actionKey, { limit: 1, windowSeconds: 60 });
    const blockedA = await enforceRateLimit(ipA, mockEnv, actionKey, { limit: 1, windowSeconds: 60 });
    expect(blockedA?.status).toBe(429);

    // IP B should still be allowed
    const allowedB = await enforceRateLimit(ipB, mockEnv, actionKey, { limit: 1, windowSeconds: 60 });
    expect(allowedB).toBeNull();
  });
});
