import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in to vote." }, { status: 401 });
  }

  const userId = session.user.id;

  let body: { competitionId: string; contestantId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { competitionId, contestantId } = body;
  if (!competitionId || !contestantId) {
    return NextResponse.json({ error: "Missing competitionId or contestantId." }, { status: 400 });
  }

  // Verify competition is active and is a PUBLIC_VOTING type
  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition) {
    return NextResponse.json({ error: "Competition not found." }, { status: 404 });
  }
  if (competition.competitionType !== "PUBLIC_VOTING") {
    return NextResponse.json({ error: "This competition does not accept public votes." }, { status: 400 });
  }
  if (competition.status !== "ACTIVE") {
    return NextResponse.json({ error: "This competition is not currently active." }, { status: 400 });
  }

  // Verify the contestant entry is approved
  const entry = await prisma.competitionEntry.findFirst({
    where: { competitionId, contestantId, approved: true },
  });
  if (!entry) {
    return NextResponse.json({ error: "Contestant is not in this competition." }, { status: 404 });
  }

  try {
    // ── Atomic: create vote + increment voteCount ──
    await prisma.$transaction([
      prisma.vote.create({
        data: { competitionId, contestantId, voterId: userId },
      }),
      prisma.competitionEntry.update({
        where: { id: entry.id },
        data: { voteCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err) {
      const prismaError = err as { code: string };
      // Prisma P2002 = unique constraint violation → already voted
      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "You have already voted in this competition." },
          { status: 409 }
        );
      }
      // Prisma P2003 = foreign key constraint violation → invalid voterId
      if (prismaError.code === "P2003") {
        return NextResponse.json(
          { error: "Your session is invalid or your account was deleted. Please log in again." },
          { status: 401 }
        );
      }
    }
    console.error("Vote error:", err);
    return NextResponse.json({ error: "Failed to cast vote." }, { status: 500 });
  }
}
