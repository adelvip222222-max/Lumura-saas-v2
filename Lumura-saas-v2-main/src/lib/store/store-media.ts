import { deleteFromCloudinary } from "@/lib/cloudinary";

export type StoreMediaField = "logo" | "cover" | "favicon";

const MEDIA_PUBLIC_ID_KEYS = {
  logo: "logoPublicId",
  cover: "coverPublicId",
  favicon: "faviconPublicId",
} as const;

export function getCloudinaryUploadTransform(type: string) {
  switch (type) {
    case "logo":
      return [{ width: 400, height: 400, crop: "limit", quality: "auto", fetch_format: "auto" }];
    case "favicon":
      return [{ width: 64, height: 64, crop: "fill", quality: "auto", fetch_format: "auto" }];
    case "cover":
      return [{ width: 1600, height: 600, crop: "limit", quality: "auto", fetch_format: "auto" }];
    case "product":
      return [{ width: 1200, height: 1200, crop: "limit", quality: "auto", fetch_format: "auto" }];
    case "category":
    case "brand":
      return [{ width: 600, height: 600, crop: "limit", quality: "auto", fetch_format: "auto" }];
    default:
      return [{ quality: "auto", fetch_format: "auto" }];
  }
}

/** حذف الصورة القديمة من Cloudinary عند الاستبدال أو الإزالة */
export async function cleanupStoreMediaOnUpdate(
  previous: {
    logoPublicId?: string | null;
    coverPublicId?: string | null;
    faviconPublicId?: string | null;
  },
  next: {
    logo?: string;
    logoPublicId?: string;
    coverImage?: string;
    coverPublicId?: string;
    favicon?: string;
    faviconPublicId?: string;
  }
): Promise<void> {
  const tasks: Promise<boolean>[] = [];

  if (next.logo !== undefined) {
    const removed = !next.logo;
    const replaced =
      next.logoPublicId &&
      previous.logoPublicId &&
      next.logoPublicId !== previous.logoPublicId;
    if (previous.logoPublicId && (removed || replaced)) {
      tasks.push(deleteFromCloudinary(previous.logoPublicId));
    }
  }

  if (next.coverImage !== undefined) {
    const removed = !next.coverImage;
    const replaced =
      next.coverPublicId &&
      previous.coverPublicId &&
      next.coverPublicId !== previous.coverPublicId;
    if (previous.coverPublicId && (removed || replaced)) {
      tasks.push(deleteFromCloudinary(previous.coverPublicId));
    }
  }

  if (next.favicon !== undefined) {
    const removed = !next.favicon;
    const replaced =
      next.faviconPublicId &&
      previous.faviconPublicId &&
      next.faviconPublicId !== previous.faviconPublicId;
    if (previous.faviconPublicId && (removed || replaced)) {
      tasks.push(deleteFromCloudinary(previous.faviconPublicId));
    }
  }

  await Promise.all(tasks.map((p) => p.catch(() => false)));
}

export { MEDIA_PUBLIC_ID_KEYS };
