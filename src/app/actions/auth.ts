"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthError } from "next-auth";

/* ── Validation Schemas ── */

const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name is too long."),
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
  role: z.enum(["PUBLIC", "CONTESTANT"]).default("PUBLIC"),
});

/* ── Types ── */

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
} | null;

/* ── Login Action ── */

export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const callbackUrl = formData.get("callbackUrl") as string | null;

  const validated = LoginSchema.safeParse(raw);

  if (!validated.success) {
    return {
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong." };
      }
    }
    throw error; // Rethrow NEXT_REDIRECT error if it occurs
  }

  redirect(callbackUrl || "/dashboard");
}

/* ── Register Action ── */

export async function registerAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: (formData.get("role") as string) || "PUBLIC",
  };

  const validated = RegisterSchema.safeParse(raw);

  if (!validated.success) {
    return {
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, role } = validated.data;

  // Check for existing user
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  // Create user
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
  });

  // Sign in the new user
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    return { error: "Account created but could not sign in. Please log in manually." };
  }

  redirect("/dashboard");
}

/* ── Google Sign In ── */

export async function googleSignIn(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl") as string | null;
  await signIn("google", { redirectTo: callbackUrl || "/dashboard" });
}

/* ── Sign Out ── */

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
