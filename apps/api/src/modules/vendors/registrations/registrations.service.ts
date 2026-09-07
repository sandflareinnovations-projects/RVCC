import type { Prisma, RegistrationStatus } from "@prisma/client";
import type { Env } from "../../../config/env";
import { generateTempPassword, hashPassword } from "../../../lib/password";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import { toCsvRow } from "../../sourcing/services/sourcing.service";
import { notifyDecision } from "../../system/services/notification.service";
import type { RegistrationDetail } from "../types/vendors.types";

const REVIEWABLE = new Set(["SUBMITTED"]);
const VALID_REG_STATUS = new Set(["SUBMITTED", "APPROVED", "REJECTED", "DRAFT", "ALL"]);

export class RegistrationsService {
  /**
   * Full registration graph
   */
  static async loadRegistration(id: string): Promise<RegistrationDetail | null> {
    const reg = await prisma.supplierRegistration.findUnique({
      where: { id },
      include: {
        company: true,
        contacts: { orderBy: { sortOrder: "asc" } },
        addresses: { orderBy: { sortOrder: "asc" } },
        classifications: { orderBy: { sortOrder: "asc" } },
        bankAccounts: { orderBy: { sortOrder: "asc" } },
        questionnaire: true,
        attachments: true,
        vendorUsers: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            mustChangePassword: true,
            createdAt: true,
          },
        },
        reviewedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!reg) return null;

    return {
      ...reg,
      id: reg.id,
      email: reg.email,
      status: reg.status,
      referenceNumber: reg.referenceNumber ?? null,
      company: reg.company || null,
      contacts: reg.contacts as unknown as Array<Record<string, unknown>>,
      addresses: reg.addresses as unknown as Array<Record<string, unknown>>,
      classifications: reg.classifications as unknown as Array<Record<string, unknown>>,
      bankAccounts: reg.bankAccounts as unknown as Array<Record<string, unknown>>,
      questionnaire: reg.questionnaire as unknown as Array<Record<string, unknown>>,
      attachments: reg.attachments as unknown as Array<Record<string, unknown>>,
      vendorUsers: reg.vendorUsers as unknown as Array<Record<string, unknown>>,
      reviewedBy: reg.reviewedBy ? { name: reg.reviewedBy.name, email: reg.reviewedBy.email } : null,
    };
  }

  /**
   * List registrations
   */
  static async listRegistrations(statusRaw?: string, q?: string) {
    const status = VALID_REG_STATUS.has(statusRaw || "") ? statusRaw! : "SUBMITTED";
    const cleanQ = (q || "").replace(/[\0-\x1f\x7f]/g, "").trim().slice(0, 120);

    const where: Prisma.SupplierRegistrationWhereInput = {};
    if (status !== "ALL") {
      where.status = status as RegistrationStatus;
    }
    if (cleanQ) {
      where.OR = [
        { email: { contains: cleanQ, mode: "insensitive" } },
        { referenceNumber: { contains: cleanQ, mode: "insensitive" } },
        { company: { legalName: { contains: cleanQ, mode: "insensitive" } } },
      ];
    }

    const rows = await prisma.supplierRegistration.findMany({
      where,
      include: {
        company: {
          select: {
            legalName: true,
            country: true,
            dbaName: true,
          },
        },
      },
      orderBy: [{ submittedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
      take: 500,
    });

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      status: r.status,
      referenceNumber: r.referenceNumber,
      submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
      reviewNote: r.reviewNote,
      productCategories: r.productCategories,
      company: r.company
        ? {
            legalName: r.company.legalName,
            dbaName: r.company.dbaName,
            country: r.company.country,
          }
        : null,
    }));
  }

  /**
   * Review registration (approve / reject)
   */
  static async reviewRegistration(
    admin: { id: string; name?: string; role?: string },
    id: string,
    decision: "APPROVED" | "REJECTED",
    reviewNote: string,
    env: Env
  ) {
    const existing = await prisma.supplierRegistration.findUnique({
      where: { id },
      include: {
        company: true,
        contacts: {
          where: { isAdministrative: true },
          take: 1,
        },
      },
    });

    if (!existing) return { notFound: true };
    if (!REVIEWABLE.has(existing.status)) return { notReviewable: true, currentStatus: existing.status };

    let tempPassword = "";
    let vendorUserId: string | null = null;
    const vendorEmail = existing.email;

    await prisma.$transaction(async (tx) => {
      await tx.supplierRegistration.update({
        where: { id },
        data: {
          status: decision,
          reviewedById: admin.id,
          reviewedAt: new Date(),
          reviewNote: reviewNote || null,
        },
      });

      if (decision === "APPROVED") {
        tempPassword = generateTempPassword();
        const hash = await hashPassword(tempPassword);
        vendorUserId = cuid();

        const contact = existing.contacts[0];
        const vendorName = contact
          ? `${contact.firstName} ${contact.lastName}`.trim()
          : existing.company?.legalName || "Vendor";

        await tx.vendorUser.upsert({
          where: { email: vendorEmail },
          create: {
            id: vendorUserId,
            email: vendorEmail,
            name: vendorName,
            passwordHash: hash,
            mustChangePassword: true,
            isActive: true,
            portalAccess: "RELEASED",
            registrationId: id,
          },
          update: {
            passwordHash: hash,
            mustChangePassword: true,
            isActive: true,
            portalAccess: "RELEASED",
            registrationId: id,
          },
        });
      }
    });

    await notifyDecision(env, {
      decision,
      legalName: existing.company?.legalName || "Vendor",
      referenceNumber: existing.referenceNumber ?? id,
      reason: reviewNote || undefined,
      recipients: [
        {
          to: vendorEmail,
          loginEmail: vendorEmail,
          tempPassword: tempPassword || undefined,
        },
      ],
    });

    return {
      ok: true,
      existing,
      vendorEmail,
      vendorUserId,
      tempPassword,
    };
  }

  /**
   * Delete registration
   */
  static async deleteRegistration(id: string) {
    const existing = await prisma.supplierRegistration.findUnique({
      where: { id },
      select: { id: true, email: true, status: true, referenceNumber: true },
    });

    if (!existing) return null;

    await prisma.$transaction(async (tx) => {
      await tx.vendorUser.deleteMany({ where: { registrationId: id } });
      await tx.registrationAttachment.deleteMany({ where: { registrationId: id } });
      await tx.questionnaireAnswer.deleteMany({ where: { registrationId: id } });
      await tx.bankAccount.deleteMany({ where: { registrationId: id } });
      await tx.businessClassification.deleteMany({ where: { registrationId: id } });
      await tx.supplierAddress.deleteMany({ where: { registrationId: id } });
      await tx.supplierContact.deleteMany({ where: { registrationId: id } });
      await tx.companyProfile.deleteMany({ where: { registrationId: id } });
      await tx.supplierRegistration.delete({ where: { id } });
    });

    return existing;
  }

  /**
   * Export registrations to CSV
   */
  static async exportRegistrationsCsv() {
    const registrations = await prisma.supplierRegistration.findMany({
      include: {
        company: true,
        contacts: true,
        bankAccounts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Reference Number",
      "Status",
      "Email",
      "Legal Name",
      "Country",
      "Organization Type",
      "Supplier Type",
      "Contact Name",
      "Contact Email",
      "Contact Phone",
      "Bank Name",
      "IBAN",
      "Submitted At",
      "Reviewed At",
      "Review Note",
    ];

    const rows = [toCsvRow(headers)];

    for (const r of registrations) {
      const primaryContact = r.contacts[0];
      const primaryBank = r.bankAccounts[0];

      rows.push(
        toCsvRow([
          r.referenceNumber || r.id,
          r.status,
          r.email,
          r.company?.legalName || "",
          r.company?.country || "",
          r.company?.organizationType || "",
          r.company?.supplierType || "",
          primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}`.trim() : "",
          primaryContact?.email || "",
          primaryContact?.phone || primaryContact?.mobile || "",
          primaryBank?.bankName || "",
          primaryBank?.iban || "",
          r.submittedAt ? r.submittedAt.toISOString() : "",
          r.reviewedAt ? r.reviewedAt.toISOString() : "",
          r.reviewNote || "",
        ])
      );
    }

    return {
      csv: rows.join("\r\n"),
      filename: `supplier_registrations_${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }
}
