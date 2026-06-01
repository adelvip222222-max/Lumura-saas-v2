// src/lib/cloudinary.ts — server-only (يستخدم api_secret)
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";

function getCloudinaryCredentials() {
  const cloud_name =
    process.env.CLOUDINARY_CLOUD_NAME?.trim() ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  return { cloud_name, api_key, api_secret };
}

function ensureCloudinaryConfig() {
  const { cloud_name, api_key, api_secret } = getCloudinaryCredentials();

  const invalidCloudNames = new Set([
    "placeholder",
    "your_cloud_name",
    "saas",
    "root",
    "moderation",
  ]);
  if (
    !cloud_name ||
    invalidCloudNames.has(cloud_name.toLowerCase()) ||
    cloud_name.toUpperCase() === "YOUR_CLOUD_NAME"
  ) {
    throw new Error(
      "CLOUDINARY_CLOUD_NAME غير صحيح — استخدم اسم السحابة من لوحة Cloudinary (مثل dfgc8otqz) وليس اسم مفتاح API"
    );
  }
  if (!api_key) {
    throw new Error(
      "إعداد Cloudinary غير مكتمل: عيّن CLOUDINARY_API_KEY في .env"
    );
  }
  if (!api_secret) {
    throw new Error(
      "إعداد Cloudinary غير مكتمل: عيّن CLOUDINARY_API_SECRET في .env"
    );
  }

  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  return { cloud_name, api_key, api_secret };
}

function uploadOptions(
  folder: string,
  options?: {
    publicId?: string;
    transformation?: Record<string, unknown> | Record<string, unknown>[];
  }
) {
  return {
    folder: `lumora-saas/${folder}`,
    public_id: options?.publicId,
    transformation: options?.transformation || [
      { quality: "auto", fetch_format: "auto" },
    ],
  };
}

/** رفع Buffer عبر stream — upload() لا يقبل Buffer مباشرة */
function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  options?: {
    publicId?: string;
    transformation?: Record<string, unknown> | Record<string, unknown>[];
  }
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions(folder, options),
      (error, uploadResult) => {
        if (error) reject(error);
        else if (!uploadResult) reject(new Error("لم يُرجع Cloudinary نتيجة رفع"));
        else resolve(uploadResult);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

// رفع صورة إلى Cloudinary
export async function uploadToCloudinary(
  file: Buffer | string,
  folder: string = "stores",
  options?: {
    publicId?: string;
    transformation?: Record<string, unknown> | Record<string, unknown>[];
    mimeType?: string;
  }
): Promise<{ url: string; publicId: string }> {
  ensureCloudinaryConfig();

  try {
    let result: { secure_url: string; public_id: string };

    if (Buffer.isBuffer(file)) {
      result = await uploadBufferToCloudinary(file, folder, options);
    } else if (typeof file === "string" && file.startsWith("data:")) {
      result = (await cloudinary.uploader.upload(
        file,
        uploadOptions(folder, options)
      )) as { secure_url: string; public_id: string };
    } else if (typeof file === "string") {
      result = (await cloudinary.uploader.upload(
        file,
        uploadOptions(folder, options)
      )) as { secure_url: string; public_id: string };
    } else {
      throw new Error("نوع الملف غير مدعوم للرفع");
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    const detail =
      error instanceof Error ? error.message : "فشل رفع الصورة";
    throw new Error(detail.includes("Cloudinary") ? detail : `فشل رفع الصورة: ${detail}`);
  }
}

// حذف صورة من Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  ensureCloudinaryConfig();

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}

// الحصول على رابط صورة محولة
export function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
  }
): string {
  const { cloud_name } = getCloudinaryCredentials();
  if (cloud_name && cloud_name !== "placeholder") {
    cloudinary.config({
      cloud_name,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  return cloudinary.url(publicId, {
    width: options?.width,
    height: options?.height,
    crop: options?.crop || "limit",
    quality: options?.quality || "auto",
    fetch_format: "auto",
  });
}

export default cloudinary;
