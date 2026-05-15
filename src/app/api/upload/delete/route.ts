import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteImage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { imageId, imageUrl } = await req.json() as { imageId: string; imageUrl: string };

    // Verify the image belongs to this user's contestant profile
    const image = await prisma.contestantImage.findFirst({
      where: {
        id: imageId,
        contestant: { userId },
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    await prisma.contestantImage.delete({ where: { id: imageId } });
    await deleteImage(imageUrl, userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete image." }, { status: 500 });
  }
}
