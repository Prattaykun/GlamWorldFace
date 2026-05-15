"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Validation Schema ──────────────────────────────────────────
const ProfileSchema = z.object({
  // Identity
  name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  age: z.coerce
    .number()
    .int()
    .min(16, "Minimum age is 16")
    .max(65, "Maximum age is 65")
    .optional()
    .nullable(),
  gender: z.string().min(1, "Please select a gender").optional().nullable(),
  country: z.string().min(2, "Country is required").max(80).optional().nullable(),

  // Physical
  height: z.coerce
    .number()
    .min(100, "Minimum height is 100 cm")
    .max(250, "Maximum height is 250 cm")
    .optional()
    .nullable(),
  weight: z.coerce
    .number()
    .min(30, "Minimum weight is 30 kg")
    .max(200, "Maximum weight is 200 kg")
    .optional()
    .nullable(),
  bodyType: z.string().optional().nullable(),
  eyeColor: z.string().max(30).optional().nullable(),
  hairColor: z.string().max(30).optional().nullable(),

  // Bio & Social
  bio: z.string().max(1000, "Bio must be 1000 characters or less").optional().nullable(),
  instagram: z
    .string()
    .max(60)
    .regex(/^@?[\w.]*$/, "Invalid Instagram handle") // allow empty
    .optional()
    .nullable()
    .transform((v) => (v ? v.replace(/^@/, "") : v)), // strip leading @
  portfolioUrl: z
    .string()
    .max(255)
    .optional()
    .nullable()
    .refine(
      (v) => !v || v === "" || /^https?:\/\/.+/.test(v),
      "Please enter a valid URL starting with http:// or https://"
    ),

  // Extended profile fields
  goals: z.string().max(500, "Max 500 characters").optional().nullable(),
  achievements: z.string().max(1000, "Max 1000 characters").optional().nullable(),
  languages: z.string().max(200).optional().nullable(),
  occupation: z.string().max(100).optional().nullable(),
  personality: z.string().max(500, "Max 500 characters").optional().nullable(),
});

export type ProfileState = {
  errors?: Record<string, string[]>;
  error?: string;
  success?: boolean;
} | null;

// ── Upsert Profile ────────────────────────────────────────────
export async function upsertProfileAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userId = session.user.id;

  const raw = {
    name: formData.get("name"),
    age: formData.get("age") || null,
    gender: formData.get("gender") || null,
    country: formData.get("country") || null,
    height: formData.get("height") || null,
    weight: formData.get("weight") || null,
    bodyType: formData.get("bodyType") || null,
    eyeColor: formData.get("eyeColor") || null,
    hairColor: formData.get("hairColor") || null,
    bio: formData.get("bio") || null,
    instagram: formData.get("instagram") || null,
    portfolioUrl: formData.get("portfolioUrl") || null,
    goals: formData.get("goals") || null,
    achievements: formData.get("achievements") || null,
    languages: formData.get("languages") || null,
    occupation: formData.get("occupation") || null,
    personality: formData.get("personality") || null,
  };

  const parsed = ProfileSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  // Update User.name
  await prisma.user.update({
    where: { id: userId },
    data: { name: data.name },
  });

  // Upsert Contestant profile
  await prisma.contestant.upsert({
    where: { userId },
    update: {
      age: data.age ?? null,
      gender: data.gender ?? null,
      country: data.country ?? null,
      height: data.height ?? null,
      weight: data.weight ?? null,
      bodyType: data.bodyType ?? null,
      eyeColor: data.eyeColor ?? null,
      hairColor: data.hairColor ?? null,
      bio: data.bio ?? null,
      instagram: data.instagram ?? null,
      portfolioUrl: data.portfolioUrl ?? null,
      goals: data.goals ?? null,
      achievements: data.achievements ?? null,
      languages: data.languages ?? null,
      occupation: data.occupation ?? null,
      personality: data.personality ?? null,
    },
    create: {
      userId,
      age: data.age ?? null,
      gender: data.gender ?? null,
      country: data.country ?? null,
      height: data.height ?? null,
      weight: data.weight ?? null,
      bodyType: data.bodyType ?? null,
      eyeColor: data.eyeColor ?? null,
      hairColor: data.hairColor ?? null,
      bio: data.bio ?? null,
      instagram: data.instagram ?? null,
      portfolioUrl: data.portfolioUrl ?? null,
      goals: data.goals ?? null,
      achievements: data.achievements ?? null,
      languages: data.languages ?? null,
      occupation: data.occupation ?? null,
      personality: data.personality ?? null,
    },
  });

  // Revalidate AFTER returning success so client can show the toast first,
  // then the next navigation will fetch fresh data.
  revalidatePath("/dashboard/profile");
  return { success: true };
}
