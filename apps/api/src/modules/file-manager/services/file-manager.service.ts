import type { Env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";
import {
  ALLOWED_FILE_MANAGER_MIMES,
  deletePublicAsset,
  detectMagicMime,
  MAX_FILE_MANAGER_BYTES,
  publicUploadUrl,
  putPublicAsset,
  slugify,
  storageKeyForFileManager,
  validateUploadBytes,
} from "../../../lib/storage";
import type {
  CreateFolderInput,
  UpdateFileInput,
  UpdateFolderInput,
} from "../schemas/file-manager.schema";

export function determineFileType(
  mime: string,
  ext: string
): "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "OTHER" {
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
    return "IMAGE";
  }
  if (mime.startsWith("video/") || ["mp4", "webm", "mov", "mkv", "avi"].includes(ext)) {
    return "VIDEO";
  }
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a"].includes(ext)) {
    return "AUDIO";
  }
  if (
    mime.includes("pdf") ||
    mime.includes("word") ||
    mime.includes("officedocument") ||
    mime.includes("excel") ||
    mime.includes("presentation") ||
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"].includes(ext)
  ) {
    return "DOCUMENT";
  }
  return "OTHER";
}

export class FileManagerService {
  /**
   * List folders under parent
   */
  static async listFolders(parentId?: string | null) {
    return await (prisma as any).managedFolder.findMany({
      where: {
        parentId: parentId === "root" || !parentId ? null : parentId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            files: { where: { deletedAt: null } },
            subfolders: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Create folder
   */
  static async createFolder(input: CreateFolderInput) {
    const name = input.name.trim();
    const slug = slugify(name);
    const parentId = input.parentId?.trim() || null;
    const color = input.color?.trim() || "indigo";

    const existing = await (prisma as any).managedFolder.findFirst({
      where: { name, parentId, deletedAt: null },
    });
    if (existing) return { conflict: true };

    const folder = await (prisma as any).managedFolder.create({
      data: { name, slug, parentId, color },
    });
    return { folder };
  }

  /**
   * Update folder
   */
  static async updateFolder(id: string, input: UpdateFolderInput) {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      data.name = trimmed;
      data.slug = slugify(trimmed);
    }
    if (input.color !== undefined) data.color = input.color.trim();
    if (input.parentId !== undefined) data.parentId = input.parentId?.trim() || null;

    return await (prisma as any).managedFolder.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete folder (soft delete with cascading children)
   */
  static async deleteFolder(id: string) {
    const folder = await (prisma as any).managedFolder.findUnique({
      where: { id },
    });
    if (!folder) return null;

    const now = new Date();
    await (prisma as any).managedFolder.update({
      where: { id },
      data: { deletedAt: now },
    });

    await (prisma as any).managedFile.updateMany({
      where: { folderId: id },
      data: { deletedAt: now },
    });

    return folder;
  }

  /**
   * List files with optional search and type filtering
   */
  static async listFiles(options?: {
    folderId?: string | null;
    search?: string;
    fileType?: string;
  }) {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { originalName: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    } else if (options?.folderId !== undefined) {
      where.folderId =
        options.folderId === "root" || !options.folderId ? null : options.folderId;
    }

    if (
      options?.fileType &&
      ["IMAGE", "VIDEO", "DOCUMENT", "AUDIO", "OTHER"].includes(options.fileType)
    ) {
      where.fileType = options.fileType;
    }

    const files = await (prisma as any).managedFile.findMany({
      where,
      include: {
        folder: {
          select: { id: true, name: true, slug: true, color: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return files.map((f: any) => ({
      ...f,
      sizeBytes: Number(f.sizeBytes),
    }));
  }

  /**
   * Upload file to R2 and record in database
   */
  static async uploadFile(
    env: Env,
    file: File,
    options: { folderId?: string | null; customName?: string; description?: string | null }
  ) {
    const bytes = await file.arrayBuffer();
    const uint8 = new Uint8Array(bytes);

    const byteError = validateUploadBytes(uint8, {
      maxBytes: MAX_FILE_MANAGER_BYTES,
      allowedMimes: ALLOWED_FILE_MANAGER_MIMES,
      relaxed: true,
    });
    if (byteError) return { error: byteError };

    const parts = file.name.split(".");
    const ext =
      parts.length > 1 ? parts.pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
    const originalBaseName = parts.join(".");
    const displayName = options.customName || file.name;

    let folderSlugPath = "";
    if (options.folderId) {
      const folder = await (prisma as any).managedFolder.findUnique({
        where: { id: options.folderId },
      });
      if (folder) {
        folderSlugPath = folder.slug;
      }
    }

    const detectedMime = detectMagicMime(uint8);
    const mimeType = file.type || detectedMime || "application/octet-stream";
    const fileType = determineFileType(mimeType, ext);

    const key = storageKeyForFileManager(folderSlugPath, originalBaseName, ext);
    await putPublicAsset(env, key, bytes, mimeType);
    const fileUrl = publicUploadUrl(env, key);

    const createdFile = await (prisma as any).managedFile.create({
      data: {
        folderId: options.folderId,
        name: displayName,
        originalName: file.name,
        fileUrl,
        storageKey: key,
        fileType,
        mimeType,
        sizeBytes: BigInt(file.size),
        extension: ext,
        description: options.description,
      },
    });

    return {
      file: {
        ...createdFile,
        sizeBytes: Number(createdFile.sizeBytes),
      },
      key,
    };
  }

  /**
   * Update file details
   */
  static async updateFile(id: string, input: UpdateFileInput) {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.description !== undefined)
      data.description = input.description ? input.description.trim() : null;
    if (input.folderId !== undefined) data.folderId = input.folderId?.trim() || null;
    if (Array.isArray(input.tags)) data.tags = input.tags;

    const updated = await (prisma as any).managedFile.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      sizeBytes: Number(updated.sizeBytes),
    };
  }

  /**
   * Delete file (soft delete and delete R2 object)
   */
  static async deleteFile(env: Env, id: string) {
    const file = await (prisma as any).managedFile.findUnique({
      where: { id },
    });
    if (!file) return null;

    await (prisma as any).managedFile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    if (file.storageKey) {
      await deletePublicAsset(env, file.storageKey).catch((err) => {
        console.warn("[file_manager] delete asset error:", err);
      });
    }

    return file;
  }
}
