import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import { slugify } from "../../../lib/storage";

export class CmsServicesService {
  static async listAdminServices() {
    const services = await prisma.service.findMany({
      where: { deletedAt: null },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    const allGalleryImages = await prisma.galleryImage.findMany({
      where: { deletedAt: null },
      select: { serviceSlugs: true },
    });

    const countBySlug: Record<string, number> = {};
    for (const img of allGalleryImages) {
      const slugs = (img as any).serviceSlugs || [];
      for (const s of slugs) {
        countBySlug[s] = (countBySlug[s] || 0) + 1;
      }
    }

    return services.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      longDescription: s.longDescription,
      image: s.image,
      iconName: s.iconName,
      features: s.features,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
      _count: {
        galleryImages: countBySlug[s.slug] || 0,
      },
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  static async listPublicServices() {
    const services = await prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    return services.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      longDescription: s.longDescription,
      image: s.image,
      iconName: s.iconName,
      features: s.features,
      sortOrder: s.sortOrder,
    }));
  }

  static async getPublicServiceBySlug(slug: string) {
    const service = await prisma.service.findFirst({
      where: { slug, isActive: true, deletedAt: null },
    });
    if (!service) return null;

    const galleryImages = await prisma.galleryImage.findMany({
      where: {
        serviceSlugs: { has: slug },
        isActive: true,
        deletedAt: null,
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        project: {
          select: { id: true, slug: true, title: true },
        },
      },
    });

    return {
      service: {
        id: service.id,
        slug: service.slug,
        title: service.title,
        description: service.description,
        longDescription: service.longDescription,
        image: service.image,
        iconName: service.iconName,
        features: service.features,
        sortOrder: service.sortOrder,
        galleryImages: galleryImages.map((g) => ({
          id: g.id,
          imageUrl: g.imageUrl,
          caption: g.caption,
          projectId: g.project.id,
          projectSlug: g.project.slug,
          projectTitle: g.project.title,
        })),
      },
    };
  }

  static async getServiceById(id: string) {
    const s = await prisma.service.findFirst({
      where: { id, deletedAt: null },
    });
    if (!s) return null;

    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      longDescription: s.longDescription,
      image: s.image,
      iconName: s.iconName,
      features: s.features,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  static async createService(data: {
    title: string;
    description?: string;
    longDescription?: string;
    image?: string;
    iconName?: string;
    features?: string[];
    sortOrder?: number;
    isActive?: boolean;
    slug?: string;
  }) {
    const generatedSlug = data.slug ? slugify(data.slug) : slugify(data.title);
    let uniqueSlug = generatedSlug || `service-${Date.now()}`;
    let count = 1;
    while (await prisma.service.findFirst({ where: { slug: uniqueSlug, deletedAt: null } })) {
      uniqueSlug = `${generatedSlug}-${count++}`;
    }

    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const highest = await prisma.service.findFirst({
        where: { deletedAt: null },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = highest ? highest.sortOrder + 1 : 0;
    }

    const service = await prisma.service.create({
      data: {
        id: cuid(),
        slug: uniqueSlug,
        title: data.title,
        description: data.description || "",
        longDescription: data.longDescription || "",
        image: data.image || "",
        iconName: data.iconName || "Wrench",
        features: Array.isArray(data.features) ? data.features : [],
        sortOrder,
        isActive: data.isActive ?? true,
      },
    });

    return {
      ...service,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }

  static async updateService(id: string, data: Record<string, unknown>) {
    const updated = await prisma.service.update({
      where: { id },
      data: data as any,
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  static async deleteService(id: string) {
    const existing = await prisma.service.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    await prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return existing;
  }

  static async reorderServices(serviceIds: string[]) {
    await prisma.$transaction(
      serviceIds.map((id, index) =>
        prisma.service.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }
}
