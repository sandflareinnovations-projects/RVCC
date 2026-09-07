import type { Env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";
import {
  detectMagicMime,
  publicUploadUrl,
  putPublicAsset,
  storageKeyForClient,
  storageKeyForGallery,
  storageKeyForHero,
  storageKeyForProject,
  storageKeyForService,
  storageKeyForSisterCompany,
  validateUploadBytes,
  validateUploadFile,
} from "../../../lib/storage";

export class ContentMediaService {
  /**
   * Upload CMS media asset
   */
  static async uploadContentMedia(
    env: Env,
    file: File,
    folder: string,
    label: string
  ): Promise<{ error?: string; status?: number; fileUrl?: string; key?: string }> {
    const fileError = validateUploadFile(file, { maxBytes: 10 * 1024 * 1024 });
    if (fileError) return { error: fileError, status: 400 };

    const bytes = await file.arrayBuffer();
    const byteError = validateUploadBytes(new Uint8Array(bytes), { maxBytes: 10 * 1024 * 1024 });
    if (byteError) return { error: byteError, status: 400 };

    const detectedMime = detectMagicMime(new Uint8Array(bytes));
    const mimeType = detectedMime || file.type || "image/webp";
    const ext = detectedMime === "application/pdf" ? "pdf" : "webp";

    let key: string;
    if (folder === "hero") {
      key = storageKeyForHero(label, ext);
    } else if (folder === "clients") {
      key = storageKeyForClient(label, ext);
    } else if (folder === "sister-companies" || folder === "companies") {
      key = storageKeyForSisterCompany(label, ext);
    } else if (folder.startsWith("services/") || folder === "services") {
      const serviceFolder = folder === "services" ? "general" : folder.replace(/^services\//, "");
      key = storageKeyForService(serviceFolder, label, ext);
    } else if (folder.startsWith("projects/") || folder === "projects") {
      const projectFolder = folder === "projects" ? "general" : folder.replace(/^projects\//, "");
      key = storageKeyForProject(projectFolder, label, ext);
    } else if (folder.startsWith("gallery/")) {
      const galleryFolder = folder.replace(/^gallery\//, "");
      key = storageKeyForGallery(galleryFolder, label, ext);
    } else {
      key = storageKeyForGallery(folder, label, ext);
    }

    try {
      await putPublicAsset(env, key, bytes, mimeType);
    } catch (err) {
      console.error("[content/upload] upload error", err);
      return { error: "Failed to store public media", status: 500 };
    }

    const fileUrl = publicUploadUrl(env, key);
    return { fileUrl, key };
  }

  /**
   * Get single public media file info
   */
  static async getPublicMedia(id: string) {
    const file = await (prisma as any).managedFile.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        fileUrl: true,
        fileType: true,
        mimeType: true,
        sizeBytes: true,
        extension: true,
        description: true,
        createdAt: true,
        folder: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!file) return null;

    return {
      ...file,
      sizeBytes: Number(file.sizeBytes),
      createdAt: file.createdAt.toISOString(),
    };
  }
}
