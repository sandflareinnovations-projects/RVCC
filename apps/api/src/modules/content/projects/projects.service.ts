import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import { slugify } from "../../../lib/storage";

export class ProjectsService {
  static async listAdminProjects() {
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { gallery: { where: { deletedAt: null } } },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      serviceSlugs: (p as any).serviceSlugs ?? [],
      client: p.client,
      location: p.location,
      year: p.year,
      status: p.status,
      description: p.description,
      coverImage: p.coverImage,
      scope: p.scope,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      _count: {
        gallery: p._count.gallery,
      },
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  static async listPublicProjects() {
    const projects = await prisma.project.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        serviceSlugs: true,
        client: true,
        location: true,
        year: true,
        status: true,
        description: true,
        coverImage: true,
        scope: true,
        sortOrder: true,
        gallery: {
          where: { isActive: true, deletedAt: null },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            imageUrl: true,
            caption: true,
            serviceSlugs: true,
            isCover: true,
            sortOrder: true,
          },
        },
      },
    });

    return projects.map((p) => ({
      ...p,
      image: p.coverImage || p.gallery?.[0]?.imageUrl || "",
      serviceSlugs: (p as any).serviceSlugs ?? [],
    }));
  }

  static async getPublicProjectBySlug(slug: string) {
    const project = await prisma.project.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      include: {
        gallery: {
          where: { isActive: true, deletedAt: null },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            imageUrl: true,
            caption: true,
            serviceSlugs: true,
            isCover: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!project) return null;

    return {
      ...project,
      image: project.coverImage || project.gallery?.[0]?.imageUrl || "",
      serviceSlugs: (project as any).serviceSlugs ?? [],
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  static async getProjectById(id: string) {
    const p = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        gallery: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!p) return null;

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      serviceSlugs: (p as any).serviceSlugs ?? [],
      client: p.client,
      location: p.location,
      year: p.year,
      status: p.status,
      description: p.description,
      coverImage: p.coverImage,
      scope: p.scope,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      gallery: p.gallery.map((g) => ({
        id: g.id,
        imageUrl: g.imageUrl,
        caption: g.caption,
        serviceSlugs: (g as any).serviceSlugs ?? [],
        isCover: g.isCover,
        sortOrder: g.sortOrder,
        isActive: g.isActive,
      })),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  static async createProject(data: {
    title: string;
    category?: string;
    serviceSlugs?: string[];
    client?: string;
    location?: string;
    year?: string;
    status?: string;
    description?: string;
    coverImage?: string;
    scope?: string[];
    sortOrder?: number;
    isActive?: boolean;
    slug?: string;
  }) {
    const generatedSlug = data.slug ? slugify(data.slug) : slugify(data.title);
    let uniqueSlug = generatedSlug || `project-${Date.now()}`;
    let count = 1;
    while (await prisma.project.findFirst({ where: { slug: uniqueSlug, deletedAt: null } })) {
      uniqueSlug = `${generatedSlug}-${count++}`;
    }

    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const highest = await prisma.project.findFirst({
        where: { deletedAt: null },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = highest ? highest.sortOrder + 1 : 0;
    }

    const project = await prisma.project.create({
      data: {
        id: cuid(),
        slug: uniqueSlug,
        title: data.title,
        category: data.category || "Commercial Architecture",
        serviceSlugs: Array.isArray(data.serviceSlugs) ? data.serviceSlugs : [],
        client: data.client || "",
        location: data.location || "Riyadh, KSA",
        year: data.year || new Date().getFullYear().toString(),
        status: data.status || "Completed",
        description: data.description || "",
        coverImage: data.coverImage || "",
        scope: Array.isArray(data.scope) ? data.scope : [],
        sortOrder,
        isActive: data.isActive ?? true,
      },
    });

    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  static async updateProject(id: string, data: Record<string, unknown>) {
    const updated = await prisma.project.update({
      where: { id },
      data: data as any,
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  static async deleteProject(id: string) {
    const existing = await prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.galleryImage.updateMany({
      where: { projectId: id },
      data: { deletedAt: new Date() },
    });

    return existing;
  }

  static async reorderProjects(projectIds: string[]) {
    await prisma.$transaction(
      projectIds.map((id, index) =>
        prisma.project.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }
}
