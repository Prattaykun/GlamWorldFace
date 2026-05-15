import "server-only";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// ── Config detection ──────────────────────────────────────────
const HAS_SPACES =
  !!process.env.SPACES_KEY &&
  !!process.env.SPACES_SECRET &&
  !!process.env.NEXT_PUBLIC_SPACES_BUCKET &&
  !!process.env.NEXT_PUBLIC_SPACES_REGION;

function getSpacesEndpoint() {
  return `https://${process.env.NEXT_PUBLIC_SPACES_REGION}.digitaloceanspaces.com`;
}

function getPublicUrl(key: string) {
  return `https://${process.env.NEXT_PUBLIC_SPACES_BUCKET}.${process.env.NEXT_PUBLIC_SPACES_REGION}.digitaloceanspaces.com/${key}`;
}

// ── Validate file ─────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE_MB = 5;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed: JPG, PNG, WebP, AVIF.`;
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
  }
  return null;
}

// ── Upload ────────────────────────────────────────────────────
export async function uploadImage(
  file: File,
  userId: string,
  folder: "profile" | "face" | "full-body"
): Promise<string> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const uniqueId = crypto.randomBytes(10).toString("hex");
  const fileName = `${uniqueId}.${ext}`;
  const key = `${userId}/${folder}/${fileName}`;

  if (HAS_SPACES) {
    // ── DigitalOcean Spaces via AWS SDK S3-compatible API ──
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const client = new S3Client({
      endpoint: getSpacesEndpoint(),
      region: process.env.NEXT_PUBLIC_SPACES_REGION!,
      credentials: {
        accessKeyId: process.env.SPACES_KEY!,
        secretAccessKey: process.env.SPACES_SECRET!,
      },
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_SPACES_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ACL: "public-read",
      })
    );

    return getPublicUrl(key);
  } else {
    // ── Local fallback: public/uploads/{userId}/{folder}/ ──
    const dir = path.join(process.cwd(), "public", "uploads", userId, folder);
    await fs.mkdir(dir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(dir, fileName), buffer);

    return `/uploads/${userId}/${folder}/${fileName}`;
  }
}

// ── Delete ────────────────────────────────────────────────────
export async function deleteImage(imageUrl: string, userId: string): Promise<void> {
  if (HAS_SPACES) {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    const client = new S3Client({
      endpoint: getSpacesEndpoint(),
      region: process.env.NEXT_PUBLIC_SPACES_REGION!,
      credentials: {
        accessKeyId: process.env.SPACES_KEY!,
        secretAccessKey: process.env.SPACES_SECRET!,
      },
    });

    // Extract key from CDN URL
    const url = new URL(imageUrl);
    const key = url.pathname.replace(/^\//, "");

    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_SPACES_BUCKET!,
        Key: key,
      })
    );
  } else {
    // Local fallback delete
    if (imageUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", imageUrl);
      try {
        await fs.unlink(filePath);
      } catch {
        // Silently ignore missing files
      }
    }
  }
}
