import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // ── Auth check ──
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const imageType = formData.get("type") as string | null; // "profile" | "face" | "full-body"

    if (!file || !imageType) {
      return NextResponse.json({ error: "Missing file or type." }, { status: 400 });
    }

    if (!["profile", "face", "full-body"].includes(imageType)) {
      return NextResponse.json({ error: "Invalid image type." }, { status: 400 });
    }

    const folder = imageType as "profile" | "face" | "full-body";

    // Upload to storage (DO Spaces or local fallback)
    const url = await uploadImage(file, userId, folder);

    // ── Persist URL to DB ──
    const contestant = await prisma.contestant.findUnique({ where: { userId } });
    if (!contestant) {
      return NextResponse.json({ error: "Contestant profile not found." }, { status: 404 });
    }

    let newImageId: string | undefined;

    if (folder === "profile") {
      // Update profileImage field on Contestant
      await prisma.contestant.update({
        where: { userId },
        data: { profileImage: url },
      });
    } else {
      // Insert into ContestantImage table
      const prismaImageType = folder === "face" ? "FACE" : "FULL_BODY";
      const newImage = await prisma.contestantImage.create({
        data: {
          contestantId: contestant.id,
          imageUrl: url,
          imageType: prismaImageType,
        },
      });
      newImageId = newImage.id;
    }

    return NextResponse.json({ url, id: newImageId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
