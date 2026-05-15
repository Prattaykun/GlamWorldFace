"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

const UpdateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "CONTESTANT", "PUBLIC", "JURY"]),
});

export type UserActionState = { error?: string; success?: boolean } | null;

export async function updateUserRoleAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const admin = await requireAdmin();

  const parsed = UpdateRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: "Invalid input." };
  }

  const { userId, role } = parsed.data;

  // Prevent admin from demoting themselves
  if (userId === admin.id) {
    return { error: "You cannot change your own role." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUserAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const admin = await requireAdmin();
  const userId = formData.get("userId") as string;

  if (!userId) return { error: "Missing user ID." };
  if (userId === admin.id) return { error: "You cannot delete your own account." };

  // Cascade: delete contestant + entries first to satisfy FK constraints
  const contestant = await prisma.contestant.findUnique({ where: { userId } });
  if (contestant) {
    await prisma.competitionEntry.deleteMany({ where: { contestantId: contestant.id } });
    await prisma.contestant.delete({ where: { id: contestant.id } });
  }

  await prisma.vote.deleteMany({ where: { voterId: userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  return { success: true };
}

const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["ADMIN", "CONTESTANT", "PUBLIC", "JURY"]),
});

export async function createUserAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  await requireAdmin();

  const parsed = CreateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, email, password, role } = parsed.data;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "A user with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
  });

  revalidatePath("/admin/users");
  return { success: true };
}
