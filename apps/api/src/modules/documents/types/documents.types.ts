export interface SerializedDocument {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  fileSize: string;
  sizeBytes: number;
  pageCount: number;
  fileUrl: string;
  storageKey: string;
  filePath: string | null;
  coverImage: string;
  sortOrder: number;
  isPublished?: boolean;
  requiresAuth: boolean;
  pinCode?: string | null;
  createdAt: string;
  updatedAt: string;
}
