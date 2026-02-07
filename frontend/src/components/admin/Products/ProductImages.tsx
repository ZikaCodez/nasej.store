import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export type ProductImagesProps = {
  urls: string[];
  onChange?: (urls: string[]) => void;
  disabled?: boolean;
};

type CropOptions = {
  zoom: number; // >= 1
  offsetX: number; // -1 .. 1
  offsetY: number; // -1 .. 1
};

type UploadStatus = "pending" | "uploading" | "uploaded" | "error";

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  uploadStatus: UploadStatus;
  croppedPreviewUrl?: string;
} & CropOptions;

async function cropImageToSquare(
  src: string,
  crop: CropOptions,
  outputSize = 1024,
): Promise<Blob> {
  const image = new Image();
  image.src = src;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to load image"));
  });

  const width = image.width;
  const height = image.height;
  const baseSide = Math.min(width, height);
  const zoom = Math.max(1, crop.zoom || 1);
  const side = baseSide / zoom;

  const maxShiftX = (width - side) / 2;
  const maxShiftY = (height - side) / 2;
  const clampedOffsetX = Math.max(-1, Math.min(1, crop.offsetX || 0));
  const clampedOffsetY = Math.max(-1, Math.min(1, crop.offsetY || 0));

  let sx = width / 2 - side / 2 + clampedOffsetX * maxShiftX;
  let sy = height / 2 - side / 2 + clampedOffsetY * maxShiftY;

  sx = Math.max(0, Math.min(width - side, sx));
  sy = Math.max(0, Math.min(height - side, sy));

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context");
  }

  ctx.drawImage(image, sx, sy, side, side, 0, 0, outputSize, outputSize);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create cropped image blob"));
        return;
      }
      resolve(blob);
    }, "image/jpeg");
  });
}

export default function ProductImages({
  urls,
  onChange,
  disabled,
  showGridPreview,
}: ProductImagesProps & { showGridPreview?: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [dialogStage, setDialogStage] = useState<"idle" | "crop" | "preview">(
    "idle",
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | File[]) => {
    const allFiles = Array.from(files || []);
    if (!allFiles.length) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    const allowedExt = [".png", ".jpg", ".jpeg", ".webp"];

    const validFiles = allFiles.filter((file) => {
      const lowerName = file.name.toLowerCase();
      return (
        allowedTypes.includes(file.type) ||
        allowedExt.some((ext) => lowerName.endsWith(ext))
      );
    });

    if (!validFiles.length) {
      toast.error("Only PNG, JPG, JPEG, and WEBP images are allowed");
      return;
    }

    if (validFiles.length < allFiles.length) {
      toast.error(
        "Some files were skipped because they are not supported images.",
      );
    }

    setPendingImages((prev) => [
      ...prev,
      ...validFiles.map(
        (file, index): PendingImage => ({
          id: `${Date.now()}-${prev.length + index}`,
          file,
          previewUrl: URL.createObjectURL(file),
          zoom: 1,
          offsetX: 0,
          offsetY: 0,
          uploadStatus: "pending",
        }),
      ),
    ]);
    // Start cropping flow from the first newly added image
    setDialogStage("crop");
    setCurrentIndex(() =>
      pendingImages.length > 0 ? pendingImages.length : 0,
    );
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || saving) return;
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDialogOpen(false);
      setPendingImages((prev) => {
        prev.forEach((img) => {
          URL.revokeObjectURL(img.previewUrl);
          if (img.croppedPreviewUrl) URL.revokeObjectURL(img.croppedPreviewUrl);
        });
        return [];
      });
      setDialogStage("idle");
      setCurrentIndex(0);
    } else {
      setDialogOpen(true);
      if (pendingImages.length > 0) {
        setDialogStage("crop");
        setCurrentIndex(0);
      } else {
        setDialogStage("idle");
        setCurrentIndex(0);
      }
    }
  };

  const handleRemovePending = (id: string) => {
    setPendingImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      prev
        .filter((img) => img.id === id)
        .forEach((img) => {
          URL.revokeObjectURL(img.previewUrl);
          if (img.croppedPreviewUrl) URL.revokeObjectURL(img.croppedPreviewUrl);
        });
      if (next.length === 0) {
        setDialogStage("idle");
        setCurrentIndex(0);
      } else if (currentIndex >= next.length) {
        setCurrentIndex(next.length - 1);
      }
      return next;
    });
  };

  const handleRemove = (url: string) => {
    onChange?.(urls.filter((u) => u !== url));
  };

  const handleSaveImages = async () => {
    if (!pendingImages.length) {
      handleDialogOpenChange(false);
      return;
    }

    try {
      setSaving(true);
      const nextUrls = [...urls];
      let successCount = 0;

      for (const img of pendingImages) {
        try {
          // Mark this image as uploading
          setPendingImages((prev) =>
            prev.map((p) =>
              p.id === img.id ? { ...p, uploadStatus: "uploading" } : p,
            ),
          );

          const croppedBlob = await cropImageToSquare(
            img.previewUrl,
            { zoom: img.zoom, offsetX: img.offsetX, offsetY: img.offsetY },
            1024,
          );
          const fileNameBase = img.file.name.replace(/\.[^/.]+$/, "");
          const uploadFile = new File([croppedBlob], `${fileNameBase}-sq.jpg`, {
            type: croppedBlob.type || "image/jpeg",
          });

          const formData = new FormData();
          formData.append("image", uploadFile);

          const response = await api.post("/image", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          if (response.data.status !== "success" || !response.data.data?.url) {
            throw new Error(response.data.message || "Failed to upload image");
          }

          nextUrls.push(response.data.data.url);
          successCount += 1;

          // Mark this image as uploaded
          setPendingImages((prev) =>
            prev.map((p) =>
              p.id === img.id ? { ...p, uploadStatus: "uploaded" } : p,
            ),
          );
        } catch (err: any) {
          setPendingImages((prev) =>
            prev.map((p) =>
              p.id === img.id ? { ...p, uploadStatus: "error" } : p,
            ),
          );
          toast.error(err?.message || "Failed to upload an image");
        }
      }

      if (successCount > 0) {
        onChange?.(nextUrls);
        toast.success(successCount > 1 ? "Images saved" : "Image saved");
        // Close dialog after successful uploads
        handleDialogOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save images");
    } finally {
      setSaving(false);
      // Dialog is closed on success; remains open if all uploads failed.
    }
  };

  const prepareCroppedPreviews = async () => {
    // Generate cropped preview URLs for all pending images if missing
    const updated: PendingImage[] = [];
    for (const img of pendingImages) {
      if (img.croppedPreviewUrl) {
        updated.push(img);
        continue;
      }
      try {
        const blob = await cropImageToSquare(
          img.previewUrl,
          { zoom: img.zoom, offsetX: img.offsetX, offsetY: img.offsetY },
          1024,
        );
        const url = URL.createObjectURL(blob);
        updated.push({ ...img, croppedPreviewUrl: url });
      } catch {
        // If cropping fails, fall back to original preview
        updated.push(img);
      }
    }
    setPendingImages(updated);
  };

  const handleNextImage = async () => {
    if (!pendingImages.length) return;
    if (currentIndex < pendingImages.length - 1) {
      setCurrentIndex((idx) => Math.min(idx + 1, pendingImages.length - 1));
    } else {
      await prepareCroppedPreviews();
      setDialogStage("preview");
    }
  };

  return (
    <div className="space-y-2">
      {showGridPreview && urls.length > 0 && (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns:
              urls.length === 1
                ? "repeat(1, minmax(0, 96px))"
                : urls.length === 2
                  ? "repeat(2, minmax(0, 96px))"
                  : "repeat(4, minmax(0, 96px))"
          }}>
          {urls.map((url) => (
            <div
              key={url}
              className="relative aspect-square overflow-hidden rounded-md border bg-muted flex items-center justify-center">
              <img
                src={url}
                alt="Product"
                className="object-cover w-full h-full"
                loading="lazy"
              />
              <button
                type="button"
                className="absolute right-0 top-0 m-0.5 hover:text-destructive cursor-pointer inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground shadow"
                onClick={() => handleRemove(url)}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {!showGridPreview && urls.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {urls.map((url) => (
            <div
              key={url}
              className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted">
              <img
                src={url}
                alt="Product"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                className="absolute right-0 top-0 m-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground shadow"
                onClick={() => handleRemove(url)}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {urls.length === 0 && (
        <div className="text-xs text-muted-foreground">
          Start by adding at least one product photo.
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-center"
        onClick={() => !disabled && handleDialogOpenChange(true)}
        disabled={disabled || saving}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add variant images
      </Button>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Variant images</DialogTitle>
            <DialogDescription>
              Upload images, crop each one, then preview and save as square
              product photos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!(pendingImages.length > 0 && dialogStage === "crop") && (
              <div
                onClick={() =>
                  !disabled && !saving && fileInputRef.current?.click()
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={handleDrop}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 px-4 py-6 text-center text-xs text-muted-foreground">
                {pendingImages.length === 0 ? (
                  <>
                    <UploadCloud className="h-5 w-5" />
                    <span className="font-medium">
                      Click or drag &amp; drop
                    </span>
                    <span className="text-[11px]">
                      PNG, JPG, JPEG, WEBP • up to 25MB each
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add more images</span>
                  </>
                )}
              </div>
            )}
            {pendingImages.length > 0 && dialogStage === "crop" && (
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Crop image {Math.min(currentIndex + 1, pendingImages.length)}{" "}
                  of {pendingImages.length}
                </div>
                {pendingImages[currentIndex] && (
                  <ProductImagePreview
                    image={pendingImages[currentIndex]}
                    onChangeCrop={(update) =>
                      setPendingImages((prev) =>
                        prev.map((p, idx) =>
                          idx === currentIndex ? { ...p, ...update } : p,
                        ),
                      )
                    }
                    onRemove={() =>
                      handleRemovePending(pendingImages[currentIndex].id)
                    }
                  />
                )}
              </div>
            )}

            {pendingImages.length > 0 && dialogStage === "preview" && (
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Review images
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {pendingImages.map((img) => (
                    <ProductImagePreview
                      key={img.id}
                      image={img}
                      onChangeCrop={() => {}}
                      onRemove={() => handleRemovePending(img.id)}
                      showControls={false}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleDialogOpenChange(false)}
                disabled={saving}>
                Cancel
              </Button>
              {pendingImages.length > 0 && dialogStage === "crop" && (
                <Button
                  type="button"
                  onClick={handleNextImage}
                  disabled={saving}>
                  {currentIndex < pendingImages.length - 1
                    ? "Next image"
                    : "Preview images"}
                </Button>
              )}
              {pendingImages.length > 0 && dialogStage === "preview" && (
                <Button
                  type="button"
                  onClick={handleSaveImages}
                  disabled={saving || pendingImages.length === 0}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save images"
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        multiple
        disabled={disabled || saving}
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}

type ProductImagePreviewProps = {
  image: PendingImage;
  onChangeCrop: (update: Partial<CropOptions>) => void;
  onRemove: () => void;
  showControls?: boolean;
};

function ProductImagePreview({
  image,
  onChangeCrop,
  onRemove,
  showControls = true,
}: ProductImagePreviewProps) {
  const { previewUrl, croppedPreviewUrl, zoom, offsetX, offsetY } = image;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  // Observe container size to correctly position the crop overlay
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const cr = entry.contentRect;
      setContainerSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    // Initial measure
    const rect = el.getBoundingClientRect();
    setContainerSize({ w: rect.width, h: rect.height });
    return () => ro.disconnect();
  }, []);

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget as HTMLImageElement;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) || 1;
    onChangeCrop({ zoom: value });
  };

  const handleOffsetXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) || 0;
    onChangeCrop({ offsetX: value / 100 });
  };

  const handleOffsetYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) || 0;
    onChangeCrop({ offsetY: value / 100 });
  };

  if (!showControls) {
    // In preview mode: show the cropped square image (or fallback), without overlay
    const src = croppedPreviewUrl || previewUrl;
    return (
      <div className="space-y-2">
        <div className="relative w-full pb-[100%] overflow-hidden rounded-md border bg-muted">
          <img
            src={src}
            alt="Cropped preview"
            className="absolute inset-0 h-full w-full object-contain"
          />
          <button
            type="button"
            className="absolute cursor-pointer hover:text-destructive right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground shadow"
            onClick={onRemove}>
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
          {image.uploadStatus === "uploading" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Uploading…</span>
            </>
          )}
          {image.uploadStatus === "uploaded" && (
            <span className="font-medium text-primary">Uploaded</span>
          )}
          {image.uploadStatus === "error" && (
            <span className="text-destructive">Failed to upload</span>
          )}
        </div>
      </div>
    );
  }

  // Compute overlay geometry based on current zoom/offsets
  const baseSide = Math.min(containerSize.w, containerSize.h);
  const sidePx = baseSide / Math.max(1, zoom);
  const maxShiftX = (containerSize.w - sidePx) / 2;
  const maxShiftY = (containerSize.h - sidePx) / 2;
  const clampedOffsetX = Math.max(-1, Math.min(1, offsetX || 0));
  const clampedOffsetY = Math.max(-1, Math.min(1, offsetY || 0));
  let left = containerSize.w / 2 - sidePx / 2 + clampedOffsetX * maxShiftX;
  let top = containerSize.h / 2 - sidePx / 2 + clampedOffsetY * maxShiftY;
  left = Math.max(0, Math.min(containerSize.w - sidePx, left));
  top = Math.max(0, Math.min(containerSize.h - sidePx, top));

  // Drag to move crop overlay
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  const onOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    dragStateRef.current = {
      startX,
      startY,
      startOffsetX: clampedOffsetX,
      startOffsetY: clampedOffsetY,
    };
    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp, { once: true });
  };

  const onWindowMouseMove = (e: MouseEvent) => {
    if (!dragStateRef.current) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    const newOffsetX =
      dragStateRef.current.startOffsetX + (maxShiftX ? dx / maxShiftX : 0);
    const newOffsetY =
      dragStateRef.current.startOffsetY + (maxShiftY ? dy / maxShiftY : 0);
    onChangeCrop({
      offsetX: Math.max(-1, Math.min(1, newOffsetX)),
      offsetY: Math.max(-1, Math.min(1, newOffsetY)),
    });
  };

  const onWindowMouseUp = () => {
    dragStateRef.current = null;
    window.removeEventListener("mousemove", onWindowMouseMove);
  };

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative w-full max-h-[60vh] sm:max-h-[50vh] overflow-hidden rounded-md border bg-muted"
        style={{
          // Show full image by matching the container to the image aspect ratio
          aspectRatio:
            naturalSize.w > 0 && naturalSize.h > 0
              ? `${naturalSize.w} / ${naturalSize.h}`
              : "1 / 1",
        }}>
        <img
          src={previewUrl}
          alt="Preview"
          className="absolute inset-0 h-full w-full object-contain"
          onLoad={onImgLoad}
        />
        {/* Movable crop overlay */}
        <div
          onMouseDown={onOverlayMouseDown}
          className="absolute border-2 border-primary/80 bg-primary/10 cursor-move"
          style={{ left, top, width: sidePx, height: sidePx }}
        />
        <button
          type="button"
          className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground shadow"
          onClick={onRemove}>
          <X className="h-3 w-3" />
        </button>
      </div>
      {showControls && (
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-10 shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={handleZoomChange}
              className="h-1 w-full cursor-pointer accent-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-10 shrink-0">X</span>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={Math.round(offsetX * 100)}
              onChange={handleOffsetXChange}
              className="h-1 w-full cursor-pointer accent-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-10 shrink-0">Y</span>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={Math.round(offsetY * 100)}
              onChange={handleOffsetYChange}
              className="h-1 w-full cursor-pointer accent-foreground"
            />
          </div>
        </div>
      )}
      {!showControls && (
        <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
          {image.uploadStatus === "uploading" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Uploading…</span>
            </>
          )}
          {image.uploadStatus === "uploaded" && (
            <span className="font-medium text-primary">Uploaded</span>
          )}
          {image.uploadStatus === "error" && (
            <span className="text-destructive">Failed to upload</span>
          )}
        </div>
      )}
    </div>
  );
}
