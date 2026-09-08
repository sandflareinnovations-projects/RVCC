import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { loadEnv } from "../../src/config/env";
import { createApp } from "../../src/app";
import { hashSha256 } from "../../src/lib/sql";
import { hashPassword } from "../../src/lib/password";

const env = loadEnv();
const app = createApp(env);

describe("QA Scenario 3: Auth Brute-Force Lockout, RBAC Escalation & Session Isolation E2E Test", () => {
  let superAdminId: string;
  let superAdminSessionToken: string;

  let reviewerId: string;
  let reviewerSessionToken: string;

  let vendorId: string;
  let vendorSessionToken: string;

  const testEmail = `brute_victim_${Date.now()}@rvcc.test`;
  const correctPassword = "VictimPassword123!";

  beforeAll(async () => {
    // 1. Setup Victim Account for Brute-Force Simulation
    await prisma.adminUser.create({
      data: {
        email: testEmail,
        name: "Victim Admin",
        passwordHash: await hashPassword(correctPassword),
        isActive: true,
        failedAttempts: 0,
        role: {
          connectOrCreate: {
            where: { name: "ADMIN" },
            create: { name: "ADMIN", description: "General Administrator", isSystem: true },
          },
        },
      },
    });

    // 2. Setup Super Admin
    superAdminId = `qa-super-${Date.now()}`;
    superAdminSessionToken = `qa-super-token-${Date.now()}`;
    await prisma.adminUser.create({
      data: {
        id: superAdminId,
        email: `super_${Date.now()}@rvcc.test`,
        name: "Super Admin",
        passwordHash: await hashPassword("SuperAdminPass123!"),
        role: {
          connectOrCreate: {
            where: { name: "SUPER_ADMIN" },
            create: { name: "SUPER_ADMIN", description: "Super Administrator", isSystem: true },
          },
        },
        sessions: {
          create: {
            tokenHash: await hashSha256(superAdminSessionToken),
            expiresAt: new Date(Date.now() + 3600000),
          },
        },
      },
    });

    // 3. Setup Low-Privilege Reviewer
    reviewerId = `qa-reviewer-${Date.now()}`;
    reviewerSessionToken = `qa-reviewer-token-${Date.now()}`;
    await prisma.adminUser.create({
      data: {
        id: reviewerId,
        email: `reviewer_${Date.now()}@rvcc.test`,
        name: "Reviewer Staff",
        passwordHash: await hashPassword("ReviewerPass123!"),
        role: {
          connectOrCreate: {
            where: { name: "REVIEWER" },
            create: { name: "REVIEWER", description: "Read-only Reviewer", isSystem: true },
          },
        },
        sessions: {
          create: {
            tokenHash: await hashSha256(reviewerSessionToken),
            expiresAt: new Date(Date.now() + 3600000),
          },
        },
      },
    });

    // 4. Setup Vendor User
    vendorId = `qa-vendor-iso-${Date.now()}`;
    vendorSessionToken = `qa-vendor-iso-token-${Date.now()}`;
    await prisma.vendorUser.create({
      data: {
        id: vendorId,
        email: `vendor_iso_${Date.now()}@vendor.test`,
        name: "Vendor Isolation Test",
        passwordHash: await hashPassword("VendorPass123!"),
        isActive: true,
        portalAccess: "RELEASED",
        sessions: {
          create: {
            tokenHash: await hashSha256(vendorSessionToken),
            expiresAt: new Date(Date.now() + 3600000),
          },
        },
      },
    });
  });

  afterAll(async () => {
    try {
      await prisma.adminSession.deleteMany({ where: { adminId: { in: [superAdminId, reviewerId] } } });
      await prisma.adminLoginHistory.deleteMany({ where: { admin: { email: testEmail } } });
      await prisma.adminUser.deleteMany({ where: { email: testEmail } });
      await prisma.adminUser.deleteMany({ where: { id: { in: [superAdminId, reviewerId] } } });

      await prisma.vendorSession.deleteMany({ where: { vendorId } });
      await prisma.vendorUser.deleteMany({ where: { id: vendorId } });
    } catch (err) {
      console.warn("Auth QA cleanup warning:", err);
    }
  });

  it("Step 1: Brute-Force Defense — 5 incorrect attempts trigger account lockout (HTTP 429)", async () => {
    // 4 incorrect attempts -> Expect 401
    for (let i = 1; i <= 4; i++) {
      const res = await app.request("/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: "WrongPassword!" }),
      });
      expect(res.status).toBe(401);
    }

    // 5th incorrect attempt -> Reaches MAX_FAILED_ATTEMPTS threshold (locks account)
    const fifthRes = await app.request("/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: "WrongPassword!" }),
    });
    expect(fifthRes.status).toBe(429);
    const fifthBody = await fifthRes.json();
    expect(fifthBody.error).toMatch(/Too many failed attempts/i);

    // 6th attempt with the CORRECT password while locked -> Must STILL be rejected with 429
    const lockedRes = await app.request("/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: correctPassword }),
    });
    expect(lockedRes.status).toBe(429);
    const lockedBody = await lockedRes.json();
    expect(lockedBody.error).toMatch(/Too many failed attempts/i);
  });

  it("Step 2: RBAC Privilege Escalation Defense — Reviewer cannot create or delete staff", async () => {
    // Reviewer attempts to delete staff
    const deleteAttempt = await app.request(`/admin/staff/${reviewerId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Session": reviewerSessionToken,
      },
      body: JSON.stringify({ otpCode: "123456" }),
    });

    // Forbidden: insufficient permissions (HTTP 403)
    expect(deleteAttempt.status).toBe(403);
    const delBody = await deleteAttempt.json();
    expect(delBody.error).toMatch(/Forbidden|insufficient permissions/i);

    // Reviewer attempts to create new staff member
    const createAttempt = await app.request("/admin/staff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Session": reviewerSessionToken,
      },
      body: JSON.stringify({
        email: "hacker@rvcc.test",
        password: "NewPassword123!",
        name: "Unauthorized Staff",
        role: "SUPER_ADMIN",
        otpCode: "123456",
      }),
    });

    expect(createAttempt.status).toBe(403);
    const createBody = await createAttempt.json();
    expect(createBody.error).toMatch(/Forbidden|insufficient permissions/i);
  });

  it("Step 3: Cross-Portal Session Isolation — Vendor cannot use Vendor Token on Admin routes", async () => {
    // Vendor tries to call /admin/auth/me with X-Vendor-Session or X-Admin-Session set to vendor token
    const resA = await app.request("/admin/auth/me", {
      method: "GET",
      headers: {
        "X-Vendor-Session": vendorSessionToken,
      },
    });
    expect(resA.status).toBe(401);

    const resB = await app.request("/admin/auth/me", {
      method: "GET",
      headers: {
        "X-Admin-Session": vendorSessionToken, // Vendor token passed into Admin session header
      },
    });
    expect(resB.status).toBe(401);
  });

  it("Step 4: Cross-Portal Session Isolation — Admin cannot use Admin Token on Vendor routes", async () => {
    // Super Admin tries to call /vendor/dashboard with Admin token
    const resA = await app.request("/vendor/dashboard", {
      method: "GET",
      headers: {
        "X-Admin-Session": superAdminSessionToken,
      },
    });
    expect(resA.status).toBe(401);

    const resB = await app.request("/vendor/dashboard", {
      method: "GET",
      headers: {
        "X-Vendor-Session": superAdminSessionToken, // Admin token passed into Vendor session header
      },
    });
    expect(resB.status).toBe(401);
  });
});
