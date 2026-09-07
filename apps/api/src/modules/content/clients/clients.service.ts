import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";

export class ClientsService {
  static async listAdminClients() {
    const clients = await prisma.clientPartner.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return clients.map((c) => ({
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

  static async listPublicClients() {
    const clients = await prisma.clientPartner.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return clients.map((c) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logoUrl,
      industry: c.industry,
      websiteUrl: c.websiteUrl,
      sortOrder: c.sortOrder,
    }));
  }

  static async getClientById(id: string) {
    const client = await prisma.clientPartner.findFirst({
      where: { id, deletedAt: null },
    });
    if (!client) return null;

    return {
      id: client.id,
      name: client.name,
      logoUrl: client.logoUrl,
      industry: client.industry,
      websiteUrl: client.websiteUrl,
      sortOrder: client.sortOrder,
      isActive: client.isActive,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }

  static async createClient(data: {
    name: string;
    logoUrl: string;
    industry?: string;
    websiteUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const highest = await prisma.clientPartner.findFirst({
        where: { deletedAt: null },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = highest ? highest.sortOrder + 1 : 0;
    }

    const client = await prisma.clientPartner.create({
      data: {
        id: cuid(),
        name: data.name,
        logoUrl: data.logoUrl,
        industry: data.industry || "General",
        websiteUrl: data.websiteUrl ? data.websiteUrl.trim() : null,
        sortOrder,
        isActive: data.isActive ?? true,
      },
    });

    return {
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }

  static async updateClient(id: string, data: Record<string, unknown>) {
    const client = await prisma.clientPartner.update({
      where: { id },
      data: data as any,
    });

    return {
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }

  static async deleteClient(id: string) {
    const existing = await prisma.clientPartner.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    await prisma.clientPartner.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return existing;
  }

  static async reorderClients(clientIds: string[]) {
    await prisma.$transaction(
      clientIds.map((id, index) =>
        prisma.clientPartner.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }
}
