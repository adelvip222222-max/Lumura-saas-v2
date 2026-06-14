"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadedImage = {
  url: string;
  publicId: string;
  alt?: string;
  isPrimary?: boolean;
};

const maxImages = 8;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxBytes = 5 * 1024 * 1024;

export function ProductImageUploader({ storeSlug }: { storeSlug: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const imagesJson = useMemo(() => JSON.stringify(images), [images]);

  function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");

    const selected = Array.from(files).slice(0, maxImages - images.length);
    const invalid = selected.find((file) => !allowedTypes.has(file.type) || file.size > maxBytes);
    if (invalid) {
      setError("الصورة يجب أن تكون JPG أو PNG أو WEBP أو GIF وبحجم أقل من 5MB.");
      return;
    }

    startTransition(async () => {
      try {
        const uploaded: UploadedImage[] = [];

        for (const file of selected) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "product");
          formData.append("storeSlug", storeSlug);

          const response = await fetch("/upload", {
            method: "POST",
            body: formData,
          });
          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.error || "فشل رفع الصورة");
          }

          uploaded.push({
            url: payload.url,
            publicId: payload.publicId,
            alt: file.name.replace(/\.[^.]+$/, ""),
          });
        }

        setImages((current) =>
          [...current, ...uploaded].map((image, index) => ({
            ...image,
            isPrimary: index === 0,
          }))
        );
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "فشل رفع الصورة");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  function removeImage(publicId: string) {
    setImages((current) =>
      current
        .filter((image) => image.publicId !== publicId)
        .map((image, index) => ({ ...image, isPrimary: index === 0 }))
    );
  }

  function makePrimary(publicId: string) {
    setImages((current) => {
      const selected = current.find((image) => image.publicId === publicId);
      if (!selected) return current;

      return [
        { ...selected, isPrimary: true },
        ...current
          .filter((image) => image.publicId !== publicId)
          .map((image) => ({ ...image, isPrimary: false })),
      ];
    });
  }

  return (
    <div className="space-y-3 lg:col-span-4">
      <input name="imagesJson" type="hidden" value={imagesJson} />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(event) => uploadFiles(event.target.files)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700">صور المنتج</p>
          <p className="text-xs text-gray-500">حتى 8 صور، والصورة الأولى هي الرئيسية.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || images.length >= maxImages}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ImagePlus className="ml-2 h-4 w-4" />}
          رفع صور
        </Button>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {images.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((image) => (
            <div key={image.publicId} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="relative aspect-square bg-gray-50">
                <Image src={image.url} alt={image.alt || "Product image"} fill className="object-cover" sizes="180px" />
                {image.isPrimary && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-1 text-xs font-bold text-white">
                    <Star className="h-3 w-3" />
                    رئيسية
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 p-2">
                <button
                  type="button"
                  className={cn(
                    "flex h-9 flex-1 items-center justify-center rounded-md border text-xs font-medium",
                    image.isPrimary ? "border-orange-200 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600"
                  )}
                  onClick={() => makePrimary(image.publicId)}
                >
                  رئيسية
                </button>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-600"
                  onClick={() => removeImage(image.publicId)}
                  aria-label="حذف الصورة"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
