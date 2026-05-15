"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ImageItem = { id: string; url: string };

interface ImageManagerProps {
  profileImage: string | null;
  faceImages: ImageItem[];
  bodyImages: ImageItem[];
}

// ── Small image grid tile ──────────────────────────────────────
function ImageTile({
  url,
  onDelete,
  alt,
}: {
  url: string;
  onDelete: () => Promise<void>;
  alt: string;
}) {
  const [deleting, setDeleting] = useState(false);
  const isLocal = url.startsWith("/");

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
      <Image
        src={url}
        alt={alt}
        fill
        unoptimized={isLocal}
        className="object-cover transition-transform duration-200 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, 160px"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="size-8"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Delete image</span>
        </Button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export function ImageManager({
  profileImage: initialProfile,
  faceImages: initialFace,
  bodyImages: initialBody,
}: ImageManagerProps) {
  const [profileImage, setProfileImage] = useState(initialProfile);
  const [faceImages, setFaceImages] = useState<ImageItem[]>(initialFace);
  const [bodyImages, setBodyImages] = useState<ImageItem[]>(initialBody);

  // ── Handlers ──
  const handleProfileUploaded = (url: string) => {
    setProfileImage(url);
    toast.success("Profile photo updated!");
  };

  const handleImageUploaded = (
    url: string,
    type: "face" | "full-body",
    id: string
  ) => {
    if (type === "face") {
      setFaceImages((prev) => [...prev, { id, url }]);
      toast.success("Face image added!");
    } else {
      setBodyImages((prev) => [...prev, { id, url }]);
      toast.success("Full body image added!");
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      const res = await fetch("/api/upload/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, imageUrl }),
      });
      if (!res.ok) throw new Error("Delete failed");

      setFaceImages((prev) => prev.filter((i) => i.id !== imageId));
      setBodyImages((prev) => prev.filter((i) => i.id !== imageId));
      toast.success("Image removed.");
    } catch {
      toast.error("Failed to delete image. Please try again.");
    }
  };


  return (
    <div className="space-y-8">
      <h2 className="text-base font-semibold">Photos</h2>

      {/* ── Profile Photo ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Preview */}
        <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted sm:size-28">
          {profileImage ? (
            <Image
              src={profileImage}
              alt="Profile photo"
              fill
              unoptimized={profileImage.startsWith("/")}
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <User className="size-10" />
            </div>
          )}
        </div>

        {/* Upload control */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Profile Photo</p>
          <p className="text-xs text-muted-foreground">
            Shown on your public profile. Use a clear, head-and-shoulders photo.
          </p>
          <ImageUploader
            uploadType="profile"
            onUploaded={(url: string) => handleProfileUploaded(url)}
            label="Change Photo"
            compact
          />
        </div>
      </section>

      {/* ── Face Images ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Face Images</p>
            <p className="text-xs text-muted-foreground">
              Close-up, well-lit face photos. ({faceImages.length}/5)
            </p>
          </div>
          {faceImages.length < 5 && (
            <ImageUploader
              uploadType="face"
              onUploaded={(url: string, id?: string) => handleImageUploaded(url, "face", id!)}
              label="Add Photo"
              compact
            />
          )}
        </div>

        <div
          className={cn(
            "grid gap-3",
            faceImages.length === 0
              ? "place-items-center"
              : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5"
          )}
        >
          {faceImages.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              No face images uploaded yet.
            </p>
          ) : (
            faceImages.map((img, i) => (
              <ImageTile
                key={img.id || img.url}
                url={img.url}
                alt={`Face image ${i + 1}`}
                onDelete={() => handleDeleteImage(img.id, img.url)}
              />
            ))
          )}
        </div>
      </section>

      {/* ── Full Body Images ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Full Body Images</p>
            <p className="text-xs text-muted-foreground">
              Full-length photos showing your build. ({bodyImages.length}/5)
            </p>
          </div>
          {bodyImages.length < 5 && (
            <ImageUploader
              uploadType="full-body"
              onUploaded={(url: string, id?: string) => handleImageUploaded(url, "full-body", id!)}
              label="Add Photo"
              compact
            />
          )}
        </div>

        <div
          className={cn(
            "grid gap-3",
            bodyImages.length === 0
              ? "place-items-center"
              : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5"
          )}
        >
          {bodyImages.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              No full body images uploaded yet.
            </p>
          ) : (
            bodyImages.map((img, i) => (
              <ImageTile
                key={img.id || img.url}
                url={img.url}
                alt={`Full body image ${i + 1}`}
                onDelete={() => handleDeleteImage(img.id, img.url)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
