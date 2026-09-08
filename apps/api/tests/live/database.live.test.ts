import { describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { loadEnv } from "../../src/config/env";
import { createApp } from "../../src/app";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("QA Live Database Integration Tests", () => {
  it("should successfully connect to PostgreSQL and execute a health query", async () => {
    const start = Date.now();
    const result = await prisma.$queryRaw<[{ '?column?': number }]>`SELECT 1`;
    const latencyMs = Date.now() - start;

    expect(result).toBeDefined();
    expect(latencyMs).toBeLessThan(10000); // Verify database latency is healthy
  }, 15000);

  it("should query requirements or projects through Prisma ORM from live database", async () => {
    // Tests real PostgreSQL connection, Prisma mapping, and soft-delete extension
    const requirements = await prisma.requirement.findMany({
      take: 5,
      select: {
        id: true,
        project: true,
        currency: true,
        status: true,
      },
    });

    expect(Array.isArray(requirements)).toBe(true);
  });

  it("should execute live /health endpoint and report database status as 'ok'", async () => {
    const app = createApp(loadEnv());
    const res = await app.request("/health", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.services.database.status).toBe("ok");
    expect(body.services.database.latencyMs).toBeTypeOf("number");
  });
});
