import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ProfileForm, type DefaultValues } from "@/components/dashboard/profile-form";
import { ImageManager } from "@/components/dashboard/image-manager";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Edit your contestant profile.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userId = session.user.id;

  // Fetch contestant with images in one query
  const contestant = await prisma.contestant.findUnique({
    where: { userId },
    include: {
      images: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true },
  });

  const faceImages = contestant?.images.filter((i) => i.imageType === "FACE") ?? [];
  const bodyImages = contestant?.images.filter((i) => i.imageType === "FULL_BODY") ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your contestant profile to join competitions.
        </p>
      </div>

      <Separator />

      {/* Profile info form */}
      <ProfileForm
        defaultValues={{
          name: user?.name ?? "",
          age: contestant?.age ?? null,
          gender: contestant?.gender ?? null,
          country: contestant?.country ?? null,
          height: contestant?.height ?? null,
          weight: contestant?.weight ?? null,
          bodyType: contestant?.bodyType ?? null,
          eyeColor: contestant?.eyeColor ?? null,
          hairColor: contestant?.hairColor ?? null,
          bio: contestant?.bio ?? null,
          instagram: contestant?.instagram ?? null,
          portfolioUrl: contestant?.portfolioUrl ?? null,
          goals: contestant?.goals ?? null,
          achievements: contestant?.achievements ?? null,
          languages: contestant?.languages ?? null,
          occupation: contestant?.occupation ?? null,
          personality: contestant?.personality ?? null,
        } as DefaultValues}
      />

      <Separator />

      {/* Image upload section */}
      <ImageManager
        profileImage={contestant?.profileImage ?? null}
        faceImages={faceImages.map((i) => ({ id: i.id, url: i.imageUrl }))}
        bodyImages={bodyImages.map((i) => ({ id: i.id, url: i.imageUrl }))}
      />
    </div>
  );
}
