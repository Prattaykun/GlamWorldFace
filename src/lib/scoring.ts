/**
 * GlamWorldFace — LLM Scoring Pipeline
 *
 * Generates system scores for a competition entry using:
 *   1. OpenAI (primary)
 *   2. Google Gemini (fallback)
 *
 * The LLM scores ONLY text fields. It does NOT evaluate images.
 * Image-based and Instagram scoring is exclusively for human jurors.
 *
 * Competition-specific rules:
 *   Admins can define `scoringCriteria` (free-text guidelines) and
 *   `scoringThresholds` (JSON structure with category weights, age limits,
 *   focus areas, etc.) per competition. These are injected into the
 *   LLM prompt so each competition can have unique scoring standards.
 */

import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

// ── Types ──────────────────────────────────────────────────

interface CategoryScores {
  presentationScore: number;
  confidenceScore: number;
  stylingScore: number;
  profileScore: number;
  professionalismScore: number;
}

interface LLMScoringResult extends CategoryScores {
  overallScore: number;
  modelName: string;
  rawOutput: string;
}

interface ScoringThresholds {
  minAge?: number;
  maxAge?: number;
  requiredGender?: string;
  categoryWeights?: {
    presentation?: number;
    confidence?: number;
    styling?: number;
    profileQuality?: number;
    professionalism?: number;
  };
  focusAreas?: string[];
  [key: string]: unknown;
}

interface ContestantProfileData {
  name: string | null;
  age: number | null;
  gender: string | null;
  country: string | null;
  height: number | null;
  weight: number | null;
  bodyType: string | null;
  bio: string | null;
  goals: string | null;
  achievements: string | null;
  languages: string | null;
  occupation: string | null;
  personality: string | null;
  portfolioUrl: string | null;
  instagram: string | null;
}

interface CompetitionContext {
  title: string;
  description: string | null;
  scoringCriteria: string | null;
  scoringThresholds: ScoringThresholds | null;
}

// ── Prompt builder ─────────────────────────────────────────

function buildScoringPrompt(
  contestantData: ContestantProfileData,
  competition: CompetitionContext
): string {
  // Build competition-specific rules block
  let competitionRulesBlock = "";

  if (competition.scoringCriteria || competition.scoringThresholds) {
    competitionRulesBlock += "\n\nCOMPETITION-SPECIFIC RULES:\n";
    competitionRulesBlock += `Competition: "${competition.title}"\n`;

    if (competition.description) {
      competitionRulesBlock += `Description: ${competition.description}\n`;
    }

    if (competition.scoringCriteria) {
      competitionRulesBlock += `\nAdmin Scoring Guidelines:\n${competition.scoringCriteria}\n`;
      competitionRulesBlock += `\nIMPORTANT: You MUST follow the above guidelines when assigning scores. They take priority over default scoring criteria.\n`;
    }

    const thresholds = competition.scoringThresholds;
    if (thresholds) {
      competitionRulesBlock += "\nStructured Thresholds:\n";

      if (thresholds.minAge || thresholds.maxAge) {
        competitionRulesBlock += `- Age requirement: ${thresholds.minAge ? `minimum ${thresholds.minAge}` : ""}${thresholds.minAge && thresholds.maxAge ? ", " : ""}${thresholds.maxAge ? `maximum ${thresholds.maxAge}` : ""}. If the contestant's age falls outside this range, deduct 2 points from Profile Quality.\n`;
      }

      if (thresholds.requiredGender) {
        competitionRulesBlock += `- Gender requirement: ${thresholds.requiredGender}. If the contestant's gender does not match, deduct 2 points from Profile Quality.\n`;
      }

      if (thresholds.categoryWeights) {
        const w = thresholds.categoryWeights;
        competitionRulesBlock += `- Category importance weights (higher = more important for this competition): Presentation=${w.presentation ?? 1}, Confidence=${w.confidence ?? 1}, Styling=${w.styling ?? 1}, Profile Quality=${w.profileQuality ?? 1}, Professionalism=${w.professionalism ?? 1}. Score categories with higher weights more generously for exceptional profiles and more strictly for weak ones.\n`;
      }

      if (thresholds.focusAreas && thresholds.focusAreas.length > 0) {
        competitionRulesBlock += `- Focus areas for this competition: ${thresholds.focusAreas.join(", ")}. If the contestant's profile demonstrates strength in these areas, reward with higher Styling and Confidence scores.\n`;
      }
    }
  }

  return `You are a beauty pageant scoring system. Score this contestant's TEXT profile on a 1–10 scale in five categories. You do NOT have access to images, so score ONLY based on the text fields provided.

CONTESTANT PROFILE:
Name: ${contestantData.name || "Not provided"}
Age: ${contestantData.age || "Not provided"}
Gender: ${contestantData.gender || "Not provided"}
Country: ${contestantData.country || "Not provided"}
Height: ${contestantData.height ? contestantData.height + " cm" : "Not provided"}
Weight: ${contestantData.weight ? contestantData.weight + " kg" : "Not provided"}
Body Type: ${contestantData.bodyType || "Not provided"}
Bio: ${contestantData.bio || "Not provided"}
Goals & Aspirations: ${contestantData.goals || "Not provided"}
Achievements & Awards: ${contestantData.achievements || "Not provided"}
Languages: ${contestantData.languages || "Not provided"}
Occupation: ${contestantData.occupation || "Not provided"}
Personality Highlights: ${contestantData.personality || "Not provided"}
Portfolio URL: ${contestantData.portfolioUrl || "Not provided"}
Instagram: ${contestantData.instagram ? "@" + contestantData.instagram : "Not provided"}
${competitionRulesBlock}
SCORING CATEGORIES (1 = very poor, 5 = average, 10 = outstanding):
1. Presentation: Clarity, structure, and appeal of the bio & profile text.
2. Confidence: Strength and ambition shown in goals, aspirations, and self-description.
3. Styling: Quality indicators from occupation, personality, and portfolio presence.
4. Profile Quality: Completeness and detail of all text fields. Missing fields lower the score.
5. Professionalism: Tone, grammar, coherence, and maturity of the written text.

Respond ONLY with valid JSON, no markdown fences, no other text:
{
  "presentationScore": <number 1-10>,
  "confidenceScore": <number 1-10>,
  "stylingScore": <number 1-10>,
  "profileScore": <number 1-10>,
  "professionalismScore": <number 1-10>,
  "overallScore": <number 1-10, average of the five>
}`;
}

// ── Score parsers ──────────────────────────────────────────

function parseScores(raw: string): CategoryScores & { overallScore: number } {
  // Strip markdown fences if the model wraps output
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  const clamp = (v: unknown): number => {
    const n = Number(v);
    if (isNaN(n)) return 5;
    return Math.max(1, Math.min(10, Math.round(n * 10) / 10));
  };

  const scores: CategoryScores = {
    presentationScore: clamp(parsed.presentationScore),
    confidenceScore: clamp(parsed.confidenceScore),
    stylingScore: clamp(parsed.stylingScore),
    profileScore: clamp(parsed.profileScore),
    professionalismScore: clamp(parsed.professionalismScore),
  };

  const overall =
    (scores.presentationScore +
      scores.confidenceScore +
      scores.stylingScore +
      scores.profileScore +
      scores.professionalismScore) /
    5;

  return { ...scores, overallScore: Math.round(overall * 10) / 10 };
}

// ── OpenAI scoring ─────────────────────────────────────────

async function scoreWithOpenAI(prompt: string): Promise<LLMScoringResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 300,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const scores = parseScores(raw);

  return { ...scores, modelName: "gpt-4o-mini", rawOutput: raw };
}

// ── Gemini scoring (fallback) ──────────────────────────────

async function scoreWithGemini(prompt: string): Promise<LLMScoringResult> {
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  const raw = response.text ?? "";
  const scores = parseScores(raw);

  return { ...scores, modelName: "gemini-2.0-flash", rawOutput: raw };
}

// ════════════════════════════════════════════════════════════
// PUBLIC API: generateLLMSystemScore
// ════════════════════════════════════════════════════════════

/**
 * Generates an LLM-based system score for a competition entry.
 * - Idempotent: skips if a SystemScore already exists, unless `force` is true.
 * - Uses OpenAI as primary, Gemini as fallback.
 * - Loads the competition's scoringCriteria and scoringThresholds
 *   and injects them into the LLM prompt so each competition can
 *   have its own scoring standards.
 */
export async function generateLLMSystemScore(
  entryId: string,
  force = false
): Promise<void> {
  // Check idempotency
  if (!force) {
    const existing = await prisma.systemScore.findUnique({ where: { entryId } });
    if (existing) return; // already scored
  }

  // Load entry with contestant data AND competition context
  const entry = await prisma.competitionEntry.findUnique({
    where: { id: entryId },
    include: {
      contestant: {
        include: { user: { select: { name: true } } },
      },
      competition: {
        select: {
          title: true,
          description: true,
          scoringCriteria: true,
          scoringThresholds: true,
        },
      },
    },
  });

  if (!entry) throw new Error("Entry not found");
  if (!entry.approved) throw new Error("Entry must be approved before scoring");

  const c = entry.contestant;
  const comp = entry.competition;

  const prompt = buildScoringPrompt(
    {
      name: c.user.name,
      age: c.age,
      gender: c.gender,
      country: c.country,
      height: c.height,
      weight: c.weight,
      bodyType: c.bodyType,
      bio: c.bio,
      goals: c.goals,
      achievements: c.achievements,
      languages: c.languages,
      occupation: c.occupation,
      personality: c.personality,
      portfolioUrl: c.portfolioUrl,
      instagram: c.instagram,
    },
    {
      title: comp.title,
      description: comp.description,
      scoringCriteria: comp.scoringCriteria,
      scoringThresholds: comp.scoringThresholds as ScoringThresholds | null,
    }
  );

  let result: LLMScoringResult;

  try {
    // Primary: OpenAI
    result = await scoreWithOpenAI(prompt);
  } catch (openaiError) {
    console.warn("OpenAI scoring failed, falling back to Gemini:", openaiError);
    try {
      // Fallback: Gemini
      result = await scoreWithGemini(prompt);
    } catch (geminiError) {
      console.error("Both OpenAI and Gemini scoring failed:", geminiError);
      throw new Error("LLM scoring failed on both providers.");
    }
  }

  // Upsert the system score
  await prisma.systemScore.upsert({
    where: { entryId },
    update: {
      presentationScore: result.presentationScore,
      confidenceScore: result.confidenceScore,
      stylingScore: result.stylingScore,
      profileScore: result.profileScore,
      professionalismScore: result.professionalismScore,
      overallScore: result.overallScore,
      modelName: result.modelName,
      rawOutput: result.rawOutput,
    },
    create: {
      entryId,
      presentationScore: result.presentationScore,
      confidenceScore: result.confidenceScore,
      stylingScore: result.stylingScore,
      profileScore: result.profileScore,
      professionalismScore: result.professionalismScore,
      overallScore: result.overallScore,
      modelName: result.modelName,
      rawOutput: result.rawOutput,
    },
  });
}

// ════════════════════════════════════════════════════════════
// FINAL SCORE COMPUTATION
// ════════════════════════════════════════════════════════════

/**
 * Computes the final combined score for a competition entry.
 *
 * Formula:
 *   final_score = (avg_human_score × 1.0 + system_score × 0.5) / 1.5
 *
 * If no system score exists, uses only the human average.
 * If no human scores exist, uses only the system score.
 * Idempotent — safe to re-run whenever new scores arrive.
 */
export async function computeFinalScoreForEntry(entryId: string): Promise<number | null> {
  const [juryScores, systemScore] = await Promise.all([
    prisma.juryScore.findMany({ where: { entryId } }),
    prisma.systemScore.findUnique({ where: { entryId } }),
  ]);

  const hasHuman = juryScores.length > 0;
  const hasSystem = !!systemScore;

  if (!hasHuman && !hasSystem) return null;

  let finalScore: number;

  if (hasHuman && hasSystem) {
    const avgHuman =
      juryScores.reduce((sum, s) => sum + s.overallScore, 0) / juryScores.length;
    finalScore = (avgHuman * 1.0 + systemScore.overallScore * 0.5) / 1.5;
  } else if (hasHuman) {
    finalScore =
      juryScores.reduce((sum, s) => sum + s.overallScore, 0) / juryScores.length;
  } else {
    finalScore = systemScore!.overallScore;
  }

  finalScore = Math.round(finalScore * 100) / 100;

  await prisma.competitionEntry.update({
    where: { id: entryId },
    data: { finalScore, overallScore: finalScore },
  });

  return finalScore;
}
