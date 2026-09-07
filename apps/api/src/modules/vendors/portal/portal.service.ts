import type { Env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import {
  deleteUpload,
  detectMagicMime,
  extractStorageKeyFromUrl,
  publicUploadUrl,
  putUpload,
  storageKeyForQuote,
  uploadStorageConfigured,
  validateUploadBytes,
  validateUploadFile,
} from "../../../lib/storage";

export class VendorPortalService {
  /**
   * Requirements this vendor may see
   */
  static async listOpenForVendor(vendorUserId: string) {
    const requirements = await prisma.requirement.findMany({
      where: {
        deletedAt: null,
        status: { in: ["OPEN", "AWARDED", "CANCELLED"] },
      },
      include: {
        invites: {
          where: { vendorUserId },
        },
        quotes: {
          where: { vendorUserId },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return requirements.map((r) => {
      const q = r.quotes[0];
      const isAwardedToMe = Boolean(q?.id && r.awardedQuoteId === q.id);
      const isPastDeadline = new Date(r.closesAt).getTime() <= Date.now();
      const isEnded = r.status === "AWARDED" || r.status === "CANCELLED" || isPastDeadline;

      let endedStatus: "WON" | "LOST" | "UNDER_EVALUATION" | "CANCELLED" | "EXPIRED" | null = null;
      if (isEnded) {
        if (r.status === "AWARDED") {
          endedStatus = isAwardedToMe ? "WON" : "LOST";
        } else if (r.status === "CANCELLED") {
          endedStatus = "CANCELLED";
        } else if (q?.status === "SUBMITTED") {
          endedStatus = "UNDER_EVALUATION";
        } else {
          endedStatus = "EXPIRED";
        }
      }

      return {
        id: r.id,
        referenceNumber: r.referenceNumber,
        scopeOfWork: r.scopeOfWork,
        project: r.project,
        currency: r.currency,
        closesAt: r.closesAt.toISOString(),
        status: r.status,
        isEnded,
        endedStatus,
        isAwardedToMe,
        awardedAt: r.awardedAt ? r.awardedAt.toISOString() : null,
        quoteId: q?.id ?? null,
        newPrice: q?.newPrice ? String(q.newPrice) : null,
        remarks: q?.remarks ?? null,
        quoteStatus: q?.status ?? null,
        submittedAt: q?.submittedAt ? q.submittedAt.toISOString() : null,
      };
    });
  }

  static async getOneForVendor(requirementId: string, vendorUserId: string) {
    const requirement = await prisma.requirement.findFirst({
      where: {
        id: requirementId,
        deletedAt: null,
      },
      include: {
        quotes: {
          where: { vendorUserId },
          include: {
            attachments: {
              orderBy: { uploadedAt: "asc" },
            },
          },
          take: 1,
        },
      },
    });

    if (!requirement) return null;

    const q = requirement.quotes[0];
    const isAwardedToMe = Boolean(q?.id && requirement.awardedQuoteId === q.id);
    const isPastDeadline = new Date(requirement.closesAt).getTime() <= Date.now();
    const isEnded =
      requirement.status === "AWARDED" ||
      requirement.status === "CANCELLED" ||
      isPastDeadline;

    let endedStatus: "WON" | "LOST" | "UNDER_EVALUATION" | "CANCELLED" | "EXPIRED" | null = null;
    if (isEnded) {
      if (requirement.status === "AWARDED") {
        endedStatus = isAwardedToMe ? "WON" : "LOST";
      } else if (requirement.status === "CANCELLED") {
        endedStatus = "CANCELLED";
      } else if (q?.status === "SUBMITTED") {
        endedStatus = "UNDER_EVALUATION";
      } else {
        endedStatus = "EXPIRED";
      }
    }

    return {
      id: requirement.id,
      referenceNumber: requirement.referenceNumber,
      scopeOfWork: requirement.scopeOfWork,
      project: requirement.project,
      currency: requirement.currency,
      closesAt: requirement.closesAt.toISOString(),
      status: requirement.status,
      isEnded,
      endedStatus,
      isAwardedToMe,
      awardedAt: requirement.awardedAt ? requirement.awardedAt.toISOString() : null,
      quote: q
        ? {
            id: q.id,
            newPrice: q.newPrice ? String(q.newPrice) : null,
            remarks: q.remarks ?? null,
            status: q.status,
            submittedAt: q.submittedAt ? q.submittedAt.toISOString() : null,
            attachments: q.attachments.map((a) => ({
              id: a.id,
              fileName: a.fileName,
              fileUrl: a.fileUrl,
              fileSize: a.fileSize,
              uploadedAt: a.uploadedAt.toISOString(),
            })),
          }
        : null,
    };
  }

  static async getVendorDashboard(vendor: {
    id: string;
    email: string;
    name: string;
    mustChangePassword: boolean;
    registrationId: string | null;
  }) {
    const vendorPayload = {
      id: vendor.id,
      email: vendor.email,
      name: vendor.name,
      mustChangePassword: vendor.mustChangePassword,
      registrationId: vendor.registrationId,
    };

    let requirements: any[] = [];
    try {
      requirements = await this.listOpenForVendor(vendor.id);
    } catch (err) {
      console.error("[vendor/dashboard] requirements list error", err);
    }

    if (!vendor.registrationId) {
      return { vendor: vendorPayload, registration: null, requirements };
    }

    let registration: any = null;
    try {
      registration = await prisma.supplierRegistration.findUnique({
        where: { id: vendor.registrationId },
        include: { company: true, attachments: true, contacts: true },
      });
    } catch (err) {
      console.error("[vendor/dashboard] registration error", err);
    }

    let companyData = null;
    if (registration?.company) {
      const tax = (registration.company.taxIdentifiers as Record<string, any>) || {};
      companyData = {
        id: registration.company.id,
        legalName: registration.company.legalName,
        dbaName: registration.company.dbaName,
        country: registration.company.country,
        website: registration.company.website,
        taxIdNumber: String(tax.taxIdNumber || ""),
        vatNumber: String(tax.vatNumber || ""),
        crNumber: String(tax.crNumber || ""),
        yearEstablished: registration.company.yearEstablished,
        dunsNumber: registration.company.dunsNumber,
      };
    }

    const registrationPayload = registration
      ? {
          id: registration.id,
          status: registration.status,
          referenceNumber: registration.referenceNumber,
          reviewNote: registration.reviewNote,
          productCategories: registration.productCategories,
          submittedAt: registration.submittedAt ? registration.submittedAt.toISOString() : null,
          reviewedAt: registration.reviewedAt ? registration.reviewedAt.toISOString() : null,
          email: registration.email,
          businessRelationship: registration.businessRelationship,
          company: companyData,
          attachments: (registration.attachments || []).map((a: any) => ({
            id: a.id,
            fileName: a.fileName,
            documentType: a.documentType,
            fileSize: a.fileSize,
            uploadedAt: a.uploadedAt ? a.uploadedAt.toISOString() : null,
          })),
          contacts: (registration.contacts || []).map((c: any) => ({
            id: c.id,
            fullName: c.fullName,
            jobTitle: c.jobTitle,
            email: c.email,
            phone: c.phone,
          })),
        }
      : null;

    return {
      vendor: vendorPayload,
      registration: registrationPayload,
      requirements,
    };
  }

  static async saveQuote(
    _env: Env,
    vendorId: string,
    requirementId: string,
    body: {
      newPrice?: string | number | null;
      currency?: string;
      remarks?: string;
      submit?: boolean;
    }
  ) {
    const submit = body.submit === true;
    const price = body.newPrice == null ? "" : String(body.newPrice).trim();
    const selectedCurrency = body.currency || "SAR";

    if (price && !/^\d+(\.\d{1,2})?$/.test(price)) {
      return { error: "Enter a price as a number with at most two decimals.", status: 400 };
    }
    if (submit && (!price || Number(price) <= 0)) {
      return { error: "Enter a price before submitting.", status: 400 };
    }

    const requirement = await prisma.requirement.findFirst({
      where: {
        id: requirementId,
        status: "OPEN",
        closesAt: { gt: new Date() },
        deletedAt: null,
        OR: [
          { invites: { some: { vendorUserId: vendorId } } },
          { quotes: { some: { vendorUserId: vendorId } } },
          { status: "OPEN" },
        ],
      },
      select: { id: true },
    });

    if (!requirement) {
      return { error: "This requirement is closed or not available to you.", status: 409 };
    }

    const numericPrice = price ? Number(price) : null;
    let amountSar = numericPrice;
    let exchangeRate = 1.0;

    if (numericPrice && selectedCurrency !== "SAR") {
      const fx = await prisma.exchangeRate.findUnique({
        where: { currency: selectedCurrency as any },
      });

      if (fx && fx.rateToSar) {
        exchangeRate = Number(fx.rateToSar);
        amountSar = numericPrice * exchangeRate;
      } else {
        return { error: `Exchange rate for ${selectedCurrency} is currently unavailable.`, status: 400 };
      }
    }

    const saved = await prisma.quote.upsert({
      where: {
        requirementId_vendorUserId: {
          requirementId,
          vendorUserId: vendorId,
        },
      },
      update: {
        newPrice: numericPrice,
        currency: selectedCurrency as any,
        exchangeRate,
        amountSar,
        remarks: String(body.remarks ?? ""),
        status: submit ? "SUBMITTED" : "DRAFT",
        submittedAt: submit ? new Date() : undefined,
      },
      create: {
        id: cuid(),
        requirementId,
        vendorUserId: vendorId,
        newPrice: numericPrice,
        currency: selectedCurrency as any,
        exchangeRate,
        amountSar,
        remarks: String(body.remarks ?? ""),
        status: submit ? "SUBMITTED" : "DRAFT",
        submittedAt: submit ? new Date() : null,
      },
      select: {
        id: true,
        status: true,
        newPrice: true,
        currency: true,
        exchangeRate: true,
        amountSar: true,
        remarks: true,
        submittedAt: true,
      },
    });

    if (numericPrice !== null) {
      void prisma.quoteRevision
        .create({
          data: {
            id: cuid(),
            quoteId: saved.id,
            requirementId,
            vendorUserId: vendorId,
            currency: selectedCurrency as any,
            exchangeRate,
            price: numericPrice,
            amountSar,
            remarks: String(body.remarks ?? ""),
            status: submit ? "SUBMITTED" : "DRAFT",
          },
        })
        .catch((err) => console.error("[quoteRevision] write failed", err));
    }

    return {
      ok: true,
      quote: {
        ...saved,
        quoteFileUrl: null,
        newPrice: saved.newPrice ? String(saved.newPrice) : null,
        amountSar: saved.amountSar ? String(saved.amountSar) : null,
        submittedAt: saved.submittedAt ? saved.submittedAt.toISOString() : null,
      },
    };
  }

  static async uploadQuoteAttachment(
    env: Env,
    vendorId: string,
    requirementId: string,
    file: File
  ) {
    if (!uploadStorageConfigured(env)) {
      return { error: "Upload storage not configured", status: 503 };
    }

    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      select: { id: true, closesAt: true, status: true },
    });
    if (!requirement) return { error: "Requirement not found.", status: 404 };

    const isPastDeadline = new Date(requirement.closesAt).getTime() <= Date.now();
    if (requirement.status === "AWARDED" || requirement.status === "CANCELLED" || isPastDeadline) {
      return { error: "Bidding is closed for this requirement.", status: 400 };
    }

    const fileError = validateUploadFile(file, { maxBytes: 15 * 1024 * 1024 });
    if (fileError) return { error: fileError, status: 400 };

    const bytes = await file.arrayBuffer();
    const byteError = validateUploadBytes(new Uint8Array(bytes), { maxBytes: 15 * 1024 * 1024 });
    if (byteError) return { error: byteError, status: 400 };

    const detectedMime = detectMagicMime(new Uint8Array(bytes));
    const mimeType = detectedMime || file.type || "application/pdf";

    let quote = await prisma.quote.findUnique({
      where: {
        requirementId_vendorUserId: {
          requirementId,
          vendorUserId: vendorId,
        },
      },
    });

    if (!quote) {
      quote = await prisma.quote.create({
        data: {
          id: cuid(),
          requirementId,
          vendorUserId: vendorId,
          status: "DRAFT",
        },
      });
    }

    const key = storageKeyForQuote(requirementId, quote.id, file.name);
    try {
      await putUpload(env, key, bytes, mimeType);
    } catch (err) {
      console.error("[quote/attachment] upload error", err);
      return { error: "Failed to store document", status: 500 };
    }

    const attachmentId = cuid();
    const fileUrl = publicUploadUrl(env, key);

    const attachment = await prisma.quoteAttachment.create({
      data: {
        id: attachmentId,
        quoteId: quote.id,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType,
      },
    });

    return {
      ok: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        fileSize: attachment.fileSize,
        uploadedAt: attachment.uploadedAt.toISOString(),
      },
    };
  }

  static async deleteQuoteAttachment(
    env: Env,
    vendorId: string,
    requirementId: string,
    attachmentId: string
  ) {
    const attachment = await prisma.quoteAttachment.findUnique({
      where: { id: attachmentId },
      include: { quote: true },
    });

    if (
      !attachment ||
      attachment.quote.vendorUserId !== vendorId ||
      attachment.quote.requirementId !== requirementId
    ) {
      return { error: "Attachment not found.", status: 404 };
    }

    const key = extractStorageKeyFromUrl(env, attachment.fileUrl);
    if (key) {
      await deleteUpload(env, key).catch(() => {});
    }

    await prisma.quoteAttachment.delete({
      where: { id: attachmentId },
    });

    return { ok: true };
  }
}
