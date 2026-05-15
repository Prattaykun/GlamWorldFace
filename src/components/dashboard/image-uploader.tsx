"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCEPTED = "image/jpeg,image/png,image/webp,image/avif";
const MAX_MB = 5;

interface ImageUploaderProps {
  uploadType: "profile" | "face" | "full-body";
  /** Called with the stored URL (and optional image DB id for gallery images) */
  onUploaded: (url: string, id?: string) => void;
  label?: string;
  /** Compact button mode vs. drag-and-drop zone */
  compact?: boolean;
}

export function ImageUploader({
  uploadType,
  onUploaded,
  label = "Upload Image",
  compact = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_MB}MB.`);
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading image…");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", uploadType);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Upload failed");
      }

      toast.success("Image uploaded!", { id: toastId });
      onUploaded(json.url, json.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg, { id: toastId });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  if (compact) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 size-3.5 animate-spin" />
          ) : (
            <Upload className="mr-2 size-3.5" />
          )}
          {uploading ? "Uploading…" : label}
        </Button>
      </>
    );
  }

  // ── Full drag-and-drop zone ──
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {uploading ? (
        <Loader2 className="size-8 animate-spin text-primary" />
      ) : (
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Upload className="size-5 text-primary" />
        </div>
      )}

      <div>
        <p className="text-sm font-medium">
          {uploading ? "Uploading…" : "Drop image here or click to browse"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          JPG, PNG, WebP up to {MAX_MB}MB
        </p>
      </div>
    </div>
  );
}
