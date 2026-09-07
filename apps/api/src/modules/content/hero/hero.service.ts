import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";

export class HeroService {
  static async listAdminSlides() {
    const slides = await prisma.heroSlide.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return slides.map((s) => ({
      id: s.id,
      badge: s.badge,
      title1: s.title1,
      title2: s.title2,
      description: s.description,
      imageUrl: s.imageUrl,
      primaryBtnText: s.primaryBtnText,
      primaryBtnLink: s.primaryBtnLink,
      secondaryBtnText: s.secondaryBtnText,
      secondaryBtnLink: s.secondaryBtnLink,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  static async listPublicSlides() {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return slides.map((s) => ({
      id: s.id,
      badge: s.badge,
      title1: s.title1,
      title2: s.title2,
      description: s.description,
      imageUrl: s.imageUrl,
      primaryBtnText: s.primaryBtnText,
      primaryBtnLink: s.primaryBtnLink,
      secondaryBtnText: s.secondaryBtnText,
      secondaryBtnLink: s.secondaryBtnLink,
      sortOrder: s.sortOrder,
    }));
  }

  static async getSlideById(id: string) {
    const slide = await prisma.heroSlide.findFirst({
      where: { id, deletedAt: null },
    });
    if (!slide) return null;

    return {
      id: slide.id,
      badge: slide.badge,
      title1: slide.title1,
      title2: slide.title2,
      description: slide.description,
      imageUrl: slide.imageUrl,
      primaryBtnText: slide.primaryBtnText,
      primaryBtnLink: slide.primaryBtnLink,
      secondaryBtnText: slide.secondaryBtnText,
      secondaryBtnLink: slide.secondaryBtnLink,
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
      createdAt: slide.createdAt.toISOString(),
      updatedAt: slide.updatedAt.toISOString(),
    };
  }

  static async createSlide(data: {
    title1: string;
    title2: string;
    imageUrl: string;
    description?: string;
    badge?: string;
    primaryBtnText?: string;
    primaryBtnLink?: string;
    secondaryBtnText?: string;
    secondaryBtnLink?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const highest = await prisma.heroSlide.findFirst({
        where: { deletedAt: null },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = highest ? highest.sortOrder + 1 : 0;
    }

    const slide = await prisma.heroSlide.create({
      data: {
        id: cuid(),
        title1: data.title1,
        title2: data.title2,
        imageUrl: data.imageUrl,
        description: data.description || "",
        badge: data.badge || "Architecture & Design",
        primaryBtnText: data.primaryBtnText ?? "Explore Works",
        primaryBtnLink: data.primaryBtnLink ?? "#projects",
        secondaryBtnText: data.secondaryBtnText ?? "E-Vendor Registration",
        secondaryBtnLink: data.secondaryBtnLink ?? "/enquire/verify",
        sortOrder,
        isActive: data.isActive ?? true,
      },
    });

    return {
      ...slide,
      createdAt: slide.createdAt.toISOString(),
      updatedAt: slide.updatedAt.toISOString(),
    };
  }

  static async updateSlide(id: string, data: Record<string, unknown>) {
    const slide = await prisma.heroSlide.update({
      where: { id },
      data: data as any,
    });

    return {
      ...slide,
      createdAt: slide.createdAt.toISOString(),
      updatedAt: slide.updatedAt.toISOString(),
    };
  }

  static async deleteSlide(id: string) {
    const existing = await prisma.heroSlide.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    await prisma.heroSlide.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return existing;
  }

  static async reorderSlides(slideIds: string[]) {
    await prisma.$transaction(
      slideIds.map((id, index) =>
        prisma.heroSlide.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }
}
