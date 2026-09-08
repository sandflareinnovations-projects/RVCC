import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { loadEnv } from "../../src/config/env";
import { createApp } from "../../src/app";
import { hashSha256 } from "../../src/lib/sql";
import { hashPassword } from "../../src/lib/password";

/**
 * Live E2E tests — requires DATABASE_URL. Run via: pnpm test:live
 * Excluded from CI by vitest.config.ts (see tests/live/** exclude).
 */
const env = loadEnv();
const app = createApp(env);

describe("QA Scenario 2: Procurement Requisition, Item Calculations & Audit Trail E2E Test", () => {
  let adminId: string;
  let adminSessionToken: string;
  let createdReqId: string;
  let referenceNumber: string;

  beforeAll(async () => {
    adminId = `qa-proc-admin-${Date.now()}`;
    adminSessionToken = `qa-proc-token-${Date.now()}`;
    const tokenHash = await hashSha256(adminSessionToken);

    await prisma.adminUser.create({
      data: {
        id: adminId,
        email: `procurement_manager_${Date.now()}@rvcc.test`,
        name: "QA Procurement Director",
        passwordHash: await hashPassword("SecureProcurement123!"),
        role: {
          connectOrCreate: {
            where: { name: "PROCUREMENT_ADMIN" },
            create: {
              name: "PROCUREMENT_ADMIN",
              description: "Procurement Portal Administrator",
              isSystem: true,
            },
          },
        },
        sessions: {
          create: {
            tokenHash,
            expiresAt: new Date(Date.now() + 3600000),
          },
        },
      },
    });
  });

  afterAll(async () => {
    try {
      if (createdReqId) {
        await prisma.purchaseRequestItem.deleteMany({ where: { purchaseRequestId: createdReqId } });
        await prisma.purchaseRequestAttachment.deleteMany({ where: { purchaseRequestId: createdReqId } });
        await prisma.auditLog.deleteMany({
          where: { entityType: "PurchaseRequest", entityId: createdReqId },
        });
        await prisma.purchaseRequest.deleteMany({ where: { id: createdReqId } });
      }
      await prisma.adminSession.deleteMany({ where: { adminId } });
      await prisma.adminUser.deleteMany({ where: { id: adminId } });
    } catch (err) {
      console.warn("Procurement QA cleanup warning:", err);
    }
  });

  it("Step 1: Create Purchase Request with multiple line items, calculated unit costs, and attachments", async () => {
    const res = await app.request("/admin/procurement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Session": adminSessionToken,
      },
      body: JSON.stringify({
        title: "Site Electrical Generators & Cable Distribution Trays",
        description: "Emergency high-voltage diesel generator package for Project Alpha site power.",
        department: "Electrical Engineering",
        requesterName: "Fahad Al-Otaibi",
        requesterEmail: "fahad.otaibi@rvcc.test",
        priority: "HIGH",
        requiredByDate: "2026-10-15",
        currency: "SAR",
        costCenter: "CC-ELEC-402",
        items: [
          {
            name: "500kVA Soundproof Diesel Generator Set",
            category: "Heavy Power Equipment",
            quantity: 2,
            unit: "units",
            estimatedUnitPrice: 140000,
            preferredVendor: "Cummins Arabia",
            notes: "Includes 48-hour fuel tank and AMF automatic transfer panel",
          },
          {
            name: "Heavy Duty Galvanized Cable Ladder (300mm x 3m)",
            category: "Electrical Containment",
            quantity: 80,
            unit: "lengths",
            estimatedUnitPrice: 250,
            preferredVendor: "National Cable Containment LLC",
            notes: "Hot-dip galvanized to BS EN ISO 1461",
          },
        ],
        attachments: [
          {
            name: "Generator_Load_Schedule_Rev2.pdf",
            url: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/spec/generator_rev2.pdf",
            sizeBytes: 1540000,
            mimeType: "application/pdf",
          },
        ],
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();

    expect(body.id).toBeDefined();
    expect(body.referenceNumber).toMatch(/^PR-\d{4}-\d{3}$/);
    expect(body.title).toBe("Site Electrical Generators & Cable Distribution Trays");
    expect(body.status).toBe("pending");
    expect(body.priority).toBe("high");

    // Math check: (2 * 140,000) + (80 * 250) = 280,000 + 20,000 = 300,000 SAR
    expect(body.totalEstimatedAmount).toBe(300000);
    expect(body.items).toHaveLength(2);
    expect(body.attachments).toHaveLength(1);

    createdReqId = body.id;
    referenceNumber = body.referenceNumber;
  });

  it("Step 2: Fetch created Purchase Request by ID and verify relational data", async () => {
    const res = await app.request(`/admin/procurement/${createdReqId}`, {
      method: "GET",
      headers: {
        "X-Admin-Session": adminSessionToken,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.id).toBe(createdReqId);
    expect(body.referenceNumber).toBe(referenceNumber);
    expect(body.costCenter).toBe("CC-ELEC-402");
    expect(body.department).toBe("Electrical Engineering");
    expect(body.items[0].totalPrice).toBe(280000);
    expect(body.items[1].totalPrice).toBe(20000);
  });

  it("Step 3: Move Requisition to 'UNDER_REVIEW'", async () => {
    const res = await app.request(`/admin/procurement/${createdReqId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Session": adminSessionToken,
      },
      body: JSON.stringify({
        status: "UNDER_REVIEW",
        note: "Assigned to Lead Electrical Cost Engineer for technical compliance verification.",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("under_review");
  });

  it("Step 4: Formally Approve Requisition and verify Audit Trail Log", async () => {
    const res = await app.request(`/admin/procurement/${createdReqId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Session": adminSessionToken,
      },
      body: JSON.stringify({
        status: "APPROVED",
        note: "All specifications meet engineering requirements. Approved for commercial tender.",
        adminNotes: "Approved under FY2026 Q4 Infrastructure Budget.",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.status).toBe("approved");
    expect(body.adminNotes).toBe("Approved under FY2026 Q4 Infrastructure Budget.");

    // Verify Audit Trail has logged the status transitions
    expect(body.auditTrail).toBeDefined();
    expect(body.auditTrail.length).toBeGreaterThanOrEqual(2);

    const latestAudit = body.auditTrail[body.auditTrail.length - 1];
    expect(latestAudit.action).toBe("Requisition Approved");
    expect(latestAudit.newStatus).toBe("approved");
    expect(latestAudit.note).toContain("All specifications meet engineering requirements");
  });

  it("Step 5: Status filtering in /admin/procurement query", async () => {
    const res = await app.request(`/admin/procurement?status=APPROVED`, {
      method: "GET",
      headers: {
        "X-Admin-Session": adminSessionToken,
      },
    });

    expect(res.status).toBe(200);
    const list = await res.json();
    expect(Array.isArray(list)).toBe(true);

    const found = list.find((r: any) => r.id === createdReqId);
    expect(found).toBeDefined();
    expect(found.status).toBe("approved");
    expect(found.itemsCount).toBe(2);
    expect(found.attachmentsCount).toBe(1);
  });
});
