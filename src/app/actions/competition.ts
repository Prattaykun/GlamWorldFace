"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CompetitionStatus, CompetitionType } from "@/generated/prisma/client";
import { generateLLMSystemScore, computeFinalScoreForEntry } from "@/lib/scoring";

// ── Helpers ───────────────────────────────────────────────────
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  return session.user;
}

// ════════════════════════════════════════════════════════════
// CREATE COMPETITION  (admin only)
// ════════════════════════════════════════════════════════════

const CompetitionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(5000).optional().nullable(),
  competitionType: z.enum(["JURY", "PUBLIC_VOTING"]),
  status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED"]).default("UPCOMING"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  scoringCriteria: z.string().max(5000).optional().nullable(),
  scoringThresholds: z.string().max(5000).optional().nullable(),
}).refine((d) => new Date(d.startDate) < new Date(d.endDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

export type CompetitionFormState = {
  errors?: Record<string, string[]>;
  error?: string;
  success?: boolean;
  id?: string;
} | null;

export async function createCompetitionAction(
  _prev: CompetitionFormState,
  formData: FormData
): Promise<CompetitionFormState> {
  try {
    const adminId = await requireAdmin();

    const raw = {
      title: formData.get("title"),
      description: formData.get("description") || null,
      competitionType: formData.get("competitionType"),
      status: formData.get("status") || "UPCOMING",
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      scoringCriteria: formData.get("scoringCriteria") || null,
      scoringThresholds: formData.get("scoringThresholds") || null,
    };

    const parsed = CompetitionSchema.safeParse(raw);
    if (!parsed.success) {
      return { errors: parsed.error.flatten().fieldErrors };
    }

    const data = parsed.data;

    // Parse scoringThresholds JSON if provided
    let thresholdsJson = null;
    if (data.scoringThresholds) {
      try {
        thresholdsJson = JSON.parse(data.scoringThresholds);
      } catch {
        return { errors: { scoringThresholds: ["Invalid JSON format"] } };
      }
    }

    const competition = await prisma.competition.create({
      data: {
        title: data.title,
        description: data.description,
        competitionType: data.competitionType as CompetitionType,
        status: data.status as CompetitionStatus,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        createdById: adminId,
        scoringCriteria: data.scoringCriteria,
        scoringThresholds: thresholdsJson,
      },
    });

    revalidatePath("/admin/competitions");
    revalidatePath("/competitions");
    return { success: true, id: competition.id };
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to create competition." };
  }
}

export async function updateCompetitionStatusAction(
  competitionId: string,
  status: "UPCOMING" | "ACTIVE" | "COMPLETED"
): Promise<void> {
  await requireAdmin();
  await prisma.competition.update({
    where: { id: competitionId },
    data: { status },
  });
  revalidatePath("/admin/competitions");
  revalidatePath("/competitions");
  revalidatePath(`/competitions/${competitionId}`);
}

// ════════════════════════════════════════════════════════════
// JOIN COMPETITION  (contestant)
// ════════════════════════════════════════════════════════════

export type JoinState = { error?: string; success?: boolean } | null;

export async function joinCompetitionAction(
  _prev: JoinState,
  formData: FormData
): Promise<JoinState> {
  const user = await requireAuth();
  const competitionId = formData.get("competitionId") as string;

  const contestant = await prisma.contestant.findUnique({ where: { userId: user.id } });
  if (!contestant) {
    return { error: "Please complete your contestant profile before joining." };
  }

  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition) return { error: "Competition not found." };
  if (competition.status !== "ACTIVE" && competition.status !== "UPCOMING") {
    return { error: "This competition is no longer accepting entries." };
  }

  try {
    await prisma.competitionEntry.create({
      data: { competitionId, contestantId: contestant.id, approved: false },
    });
  } catch {
    // P2002 = unique constraint — already joined
    return { error: "You have already joined this competition." };
  }

  revalidatePath(`/competitions/${competitionId}`);
  return { success: true };
}

// ════════════════════════════════════════════════════════════
// APPROVE / REJECT ENTRY  (admin)
// ════════════════════════════════════════════════════════════

export async function approveEntryAction(entryId: string, approve: boolean): Promise<void> {
  await requireAdmin();

  // Load the entry with competition type to decide auto-scoring
  const entry = await prisma.competitionEntry.findUnique({
    where: { id: entryId },
    include: { competition: { select: { id: true, competitionType: true } } },
  });

  if (!entry) throw new Error("Entry not found");

  await prisma.competitionEntry.update({
    where: { id: entryId },
    data: { approved: approve },
  });

  // ── Auto-trigger AI scoring when approving a JURY competition entry ──
  if (approve && entry.competition.competitionType === "JURY") {
    // Run in background (fire-and-forget) so the approval is instant
    generateLLMSystemScore(entryId)
      .then(() => computeFinalScoreForEntry(entryId))
      .then(() => {
        console.log(`[Auto-Score] AI scoring completed for entry ${entryId}`);
      })
      .catch((err) => {
        // Log but don't fail — admin can manually re-trigger if needed
        console.error(`[Auto-Score] AI scoring failed for entry ${entryId}:`, err);
      });
  }

  revalidatePath("/admin/competitions");
  revalidatePath(`/competitions/${entry.competition.id}`);
}

// ════════════════════════════════════════════════════════════
// JURY SCORING PLACEHOLDER
// ════════════════════════════════════════════════════════════

/**
 * Simulates jury scoring for an approved entry.
 * In production this would be replaced by real judge input.
 * Stores category scores in ScoreResult and updates overallScore on CompetitionEntry.
 */
export async function generateJuryScoreAction(entryId: string): Promise<void> {
  await requireAdmin();

  const entry = await prisma.competitionEntry.findUnique({
    where: { id: entryId },
    include: { scoreResult: true },
  });
  if (!entry) throw new Error("Entry not found");
  if (!entry.approved) throw new Error("Entry must be approved before scoring");

  // Simulated scores (0–100)
  const scores = {
    presentationScore: Math.round(Math.random() * 40 + 60),
    confidenceScore: Math.round(Math.random() * 40 + 60),
    stylingScore: Math.round(Math.random() * 40 + 60),
    profileScore: Math.round(Math.random() * 40 + 60),
    professionalismScore: Math.round(Math.random() * 40 + 60),
  };
  const overall =
    (scores.presentationScore +
      scores.confidenceScore +
      scores.stylingScore +
      scores.profileScore +
      scores.professionalismScore) /
    5;

  await prisma.$transaction([
    prisma.scoreResult.upsert({
      where: { entryId },
      update: { ...scores, overallScore: overall },
      create: { entryId, ...scores, overallScore: overall },
    }),
    prisma.competitionEntry.update({
      where: { id: entryId },
      data: { overallScore: overall },
    }),
  ]);

  revalidatePath("/admin/competitions");
  revalidatePath(`/competitions/${entry.competitionId}/leaderboard`);
}
