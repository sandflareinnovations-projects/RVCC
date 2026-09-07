import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";

export class GalleryService {
  static async listAdminImages(projectId?: string | null) {
    const where: any = { deletedAt: null };
    if (projectId) where.projectId = projectId;

    const images = await prisma.galleryImage.findMany({
      where,
      include: {
        project: {
          select: { id: true, title: true, slug: true },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return images.map((img) => ({
      id: img.id,
      projectId: img.projectId,
      projectTitle: img.project?.title,
      projectSlug: img.project?.slug,
      imageUrl: img.imageUrl,
      caption: img.caption,
      serviceSlugs: (img as any).serviceSlugs ?? [],
      isCover: (img as any).isCover ?? false,
      sortOrder: img.sortOrder,
      isActive: img.isActive,
      createdAt: img.createdAt.toISOString(),
      updatedAt: img.updatedAt.toISOString(),
    }));
  }

  static async listPublicImages() {
    const images = await prisma.galleryImage.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        project: { isActive: true, deletedAt: null },
      },
      include: {
        project: {
          select: { id: true, title: true, slug: true, category: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return images.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      caption: img.caption,
      serviceSlugs: (img as any).serviceSlugs ?? [],
      isCover: (img as any).isCover ?? false,
      projectId: img.projectId,
      projectTitle: img.project?.title,
      projectSlug: img.project?.slug,
      projectCategory: img.project?.category,
    }));
  }

  static async getImageById(id: string) {
    const img = await prisma.galleryImage.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
    if (!img) return null;

    return {
      id: img.id,
      projectId: img.projectId,
      projectTitle: img.project?.title,
      projectSlug: img.project?.slug,
      imageUrl: img.imageUrl,
      caption: img.caption,
      serviceSlugs: (img as any).serviceSlugs ?? [],
      isCover: (img as any).isCover ?? false,
      sortOrder: img.sortOrder,
      isActive: img.isActive,
      createdAt: img.createdAt.toISOString(),
      updatedAt: img.updatedAt.toISOString(),
    };
  }

  static async createImage(data: {
    projectId: string;
    imageUrl: string;
    caption?: string;
    serviceSlugs?: string[];
    isCover?: boolean;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const highest = await prisma.galleryImage.findFirst({
        where: { projectId: data.projectId, deletedAt: null },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = highest ? highest.sortOrder + 1 : 0;
    }

    if (data.isCover) {
      await prisma.galleryImage.updateMany({
        where: { projectId: data.projectId },
        data: { isCover: false },
      });
    }

    const image = await prisma.galleryImage.create({
      data: {
        id: cuid(),
        projectId: data.projectId,
        imageUrl: data.imageUrl,
        caption: data.caption || "",
        serviceSlugs: Array.isArray(data.serviceSlugs) ? data.serviceSlugs : [],
        isCover: Boolean(data.isCover),
        sortOrder,
        isActive: data.isActive ?? true,
      },
      include: {
        project: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    return {
      id: image.id,
      projectId: image.projectId,
      projectTitle: image.project?.title,
      projectSlug: image.project?.slug,
      imageUrl: image.imageUrl,
      caption: image.caption,
      serviceSlugs: (image as any).serviceSlugs ?? [],
      isCover: (image as any).isCover ?? false,
      sortOrder: image.sortOrder,
      isActive: image.isActive,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString(),
    };
  }

  static async updateImage(id: string, data: Record<string, unknown>) {
    const existing = await prisma.galleryImage.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    if (data.isCover === true) {
      await prisma.galleryImage.updateMany({
        where: { projectId: existing.projectId, id: { not: id } },
        data: { isCover: false },
      });
    }

    const updated = await prisma.galleryImage.update({
      where: { id },
      data: data as any,
      include: {
        project: { select: { id: true, title: true, slug: true } },
      },
    });

    return {
      id: updated.id,
      projectId: updated.projectId,
      projectTitle: updated.project?.title,
      projectSlug: updated.project?.slug,
      imageUrl: updated.imageUrl,
      caption: updated.caption,
      serviceSlugs: (updated as any).serviceSlugs ?? [],
      isCover: (updated as any).isCover ?? false,
      sortOrder: updated.sortOrder,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  static async deleteImage(id: string) {
    const existing = await prisma.galleryImage.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    await prisma.galleryImage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return existing;
  }

  static async reorderImages(imageIds: string[]) {
    await prisma.$transaction(
      imageIds.map((id, index) =>
        prisma.galleryImage.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }
}
