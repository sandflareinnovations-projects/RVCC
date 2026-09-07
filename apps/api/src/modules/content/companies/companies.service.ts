import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";

export class CompaniesService {
  static async listAdminCompanies() {
    const companies = await prisma.sisterCompany.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logoUrl,
      industry: c.industry,
      websiteUrl: c.websiteUrl,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  static async listPublicCompanies() {
    const companies = await prisma.sisterCompany.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logoUrl,
      industry: c.industry,
      websiteUrl: c.websiteUrl,
      sortOrder: c.sortOrder,
    }));
  }

  static async getCompanyById(id: string) {
    const company = await prisma.sisterCompany.findFirst({
      where: { id, deletedAt: null },
    });
    if (!company) return null;

    return {
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
      industry: company.industry,
      websiteUrl: company.websiteUrl,
      sortOrder: company.sortOrder,
      isActive: company.isActive,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  }

  static async createCompany(data: {
    name: string;
    logoUrl: string;
    industry?: string;
    websiteUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const highest = await prisma.sisterCompany.findFirst({
        where: { deletedAt: null },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = highest ? highest.sortOrder + 1 : 0;
    }

    const company = await prisma.sisterCompany.create({
      data: {
        id: cuid(),
        name: data.name,
        logoUrl: data.logoUrl,
        industry: data.industry || "Sister Concern",
        websiteUrl: data.websiteUrl ? data.websiteUrl.trim() : null,
        sortOrder,
        isActive: data.isActive ?? true,
      },
    });

    return {
      ...company,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  }

  static async updateCompany(id: string, data: Record<string, unknown>) {
    const company = await prisma.sisterCompany.update({
      where: { id },
      data: data as any,
    });

    return {
      ...company,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  }

  static async deleteCompany(id: string) {
    const existing = await prisma.sisterCompany.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    await prisma.sisterCompany.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return existing;
  }

  static async reorderCompanies(companyIds: string[]) {
    await prisma.$transaction(
      companyIds.map((id, index) =>
        prisma.sisterCompany.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }
}
