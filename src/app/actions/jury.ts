"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateLLMSystemScore, computeFinalScoreForEntry } from "@/lib/scoring";

// ── Helpers ───────────────────────────────────────────────────

async function requireJury() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "JURY") {
    throw new Error("Unauthorized: Jury role required");
  }
  return session.user;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin role required");
  }
  return session.user.id;
}

// ════════════════════════════════════════════════════════════
// JURY SCORE SUBMISSION
// ════════════════════════════════════════════════════════════

const JuryScoreSchema = z.object({
  entryId: z.string().min(1),
  presentationScore: z.coerce.number().min(1).max(10),
  confidenceScore: z.coerce.number().min(1).max(10),
  stylingScore: z.coerce.number().min(1).max(10),
  profileScore: z.coerce.number().min(1).max(10),
  professionalismScore: z.coerce.number().min(1).max(10),
  comments: z.string().max(2000).optional().nullable(),
});

export type JuryScoreState = {
  errors?: Record<string, string[]>;
  error?: string;
  success?: boolean;
} | null;

/**
 * Submits (or updates) a jury member's scores for a competition entry.
 * Each jury member can only have one set of scores per entry (upsert).
 * After saving, it automatically recomputes the final score.
 */
export async function submitJuryScoreAction(
  _prev: JuryScoreState,
  formData: FormData
): Promise<JuryScoreState> {
  try {
    const user = await requireJury();

    const raw = {
      entryId: formData.get("entryId"),
      presentationScore: formData.get("presentationScore"),
      confidenceScore: formData.get("confidenceScore"),
      stylingScore: formData.get("stylingScore"),
      profileScore: formData.get("profileScore"),
      professionalismScore: formData.get("professionalismScore"),
      comments: formData.get("comments") || null,
    };

    const parsed = JuryScoreSchema.safeParse(raw);
    if (!parsed.success) {
      return { errors: parsed.error.flatten().fieldErrors };
    }

    const data = parsed.data;

    // Verify the jury is assigned to the competition for this entry
    const entry = await prisma.competitionEntry.findUnique({
      where: { id: data.entryId },
      select: { competitionId: true, approved: true },
    });

    if (!entry) return { error: "Entry not found." };
    if (!entry.approved) return { error: "Entry is not approved for scoring." };

    const assignment = await prisma.juryAssignment.findUnique({
      where: {
        competitionId_juryUserId: {
          competitionId: entry.competitionId,
          juryUserId: user.id,
        },
      },
    });

    if (!assignment) {
      return { error: "You are not assigned to this competition." };
    }

    // Compute overall human score (avg of 5 categories)
    const overallScore =
      (data.presentationScore +
        data.confidenceScore +
        data.stylingScore +
        data.profileScore +
        data.professionalismScore) /
      5;

    // Upsert the jury score
    await prisma.juryScore.upsert({
      where: {
        entryId_juryId: {
          entryId: data.entryId,
          juryId: user.id,
        },
      },
      update: {
        presentationScore: data.presentationScore,
        confidenceScore: data.confidenceScore,
        stylingScore: data.stylingScore,
        profileScore: data.profileScore,
        professionalismScore: data.professionalismScore,
        overallScore,
        comments: data.comments,
      },
      create: {
        entryId: data.entryId,
        juryId: user.id,
        presentationScore: data.presentationScore,
        confidenceScore: data.confidenceScore,
        stylingScore: data.stylingScore,
        profileScore: data.profileScore,
        professionalismScore: data.professionalismScore,
        overallScore,
        comments: data.comments,
      },
    });

    // Recompute the final score for this entry
    await computeFinalScoreForEntry(data.entryId);

    revalidatePath("/jury");
    revalidatePath(`/competitions/${entry.competitionId}`);

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to submit score.";
    return { error: msg };
  }
}

// ════════════════════════════════════════════════════════════
// ADMIN: Assign Jury to Competition
// ════════════════════════════════════════════════════════════

export async function assignJuryAction(
  competitionId: string,
  juryEmail: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireAdmin();

    const juryUser = await prisma.user.findUnique({ where: { email: juryEmail } });
    if (!juryUser) return { error: `No user found with email: ${juryEmail}` };
    if (juryUser.role !== "JURY") return { error: `User ${juryEmail} does not have the JURY role.` };

    await prisma.juryAssignment.create({
      data: { competitionId, juryUserId: juryUser.id },
    });

    revalidatePath("/admin/competitions");
    return { success: true };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return { error: "This jury member is already assigned to this competition." };
    }
    return { error: "Failed to assign jury." };
  }
}

// ════════════════════════════════════════════════════════════
// ADMIN: Trigger LLM System Score
// ════════════════════════════════════════════════════════════

export async function triggerSystemScoreAction(
  entryId: string,
  force = false
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireAdmin();

    await generateLLMSystemScore(entryId, force);
    await computeFinalScoreForEntry(entryId);

    const entry = await prisma.competitionEntry.findUnique({
      where: { id: entryId },
      select: { competitionId: true },
    });

    revalidatePath("/admin/competitions");
    if (entry) revalidatePath(`/competitions/${entry.competitionId}`);

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate system score.";
    return { error: msg };
  }
}
