-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CONTESTANT', 'PUBLIC', 'JURY');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('FACE', 'FULL_BODY');

-- CreateEnum
CREATE TYPE "CompetitionType" AS ENUM ('JURY', 'PUBLIC_VOTING');

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ScoreSource" AS ENUM ('HUMAN', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "contestants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "country" TEXT,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "bodyType" TEXT,
    "eyeColor" TEXT,
    "hairColor" TEXT,
    "bio" TEXT,
    "instagram" TEXT,
    "portfolioUrl" TEXT,
    "goals" TEXT,
    "achievements" TEXT,
    "languages" TEXT,
    "occupation" TEXT,
    "personality" TEXT,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contestants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contestant_images" (
    "id" TEXT NOT NULL,
    "contestantId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageType" "ImageType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contestant_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "competitionType" "CompetitionType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "CompetitionStatus" NOT NULL DEFAULT 'UPCOMING',
    "coverImage" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jury_assignments" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "juryUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jury_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_entries" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "contestantId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "contestantId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_results" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "presentationScore" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION,
    "stylingScore" DOUBLE PRECISION,
    "profileScore" DOUBLE PRECISION,
    "professionalismScore" DOUBLE PRECISION,
    "overallScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jury_scores" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "juryId" TEXT NOT NULL,
    "presentationScore" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "stylingScore" DOUBLE PRECISION NOT NULL,
    "profileScore" DOUBLE PRECISION NOT NULL,
    "professionalismScore" DOUBLE PRECISION NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jury_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_scores" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "presentationScore" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "stylingScore" DOUBLE PRECISION NOT NULL,
    "profileScore" DOUBLE PRECISION NOT NULL,
    "professionalismScore" DOUBLE PRECISION NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "modelName" TEXT NOT NULL,
    "rawOutput" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "contestants_userId_key" ON "contestants"("userId");

-- CreateIndex
CREATE INDEX "contestants_userId_idx" ON "contestants"("userId");

-- CreateIndex
CREATE INDEX "contestant_images_contestantId_imageType_idx" ON "contestant_images"("contestantId", "imageType");

-- CreateIndex
CREATE INDEX "competitions_status_idx" ON "competitions"("status");

-- CreateIndex
CREATE INDEX "competitions_competitionType_status_idx" ON "competitions"("competitionType", "status");

-- CreateIndex
CREATE INDEX "jury_assignments_juryUserId_idx" ON "jury_assignments"("juryUserId");

-- CreateIndex
CREATE UNIQUE INDEX "jury_assignments_competitionId_juryUserId_key" ON "jury_assignments"("competitionId", "juryUserId");

-- CreateIndex
CREATE INDEX "competition_entries_competitionId_finalScore_idx" ON "competition_entries"("competitionId", "finalScore" DESC);

-- CreateIndex
CREATE INDEX "competition_entries_competitionId_overallScore_idx" ON "competition_entries"("competitionId", "overallScore" DESC);

-- CreateIndex
CREATE INDEX "competition_entries_competitionId_voteCount_idx" ON "competition_entries"("competitionId", "voteCount" DESC);

-- CreateIndex
CREATE INDEX "competition_entries_competitionId_approved_idx" ON "competition_entries"("competitionId", "approved");

-- CreateIndex
CREATE UNIQUE INDEX "competition_entries_competitionId_contestantId_key" ON "competition_entries"("competitionId", "contestantId");

-- CreateIndex
CREATE INDEX "votes_competitionId_contestantId_idx" ON "votes"("competitionId", "contestantId");

-- CreateIndex
CREATE UNIQUE INDEX "votes_competitionId_voterId_key" ON "votes"("competitionId", "voterId");

-- CreateIndex
CREATE UNIQUE INDEX "score_results_entryId_key" ON "score_results"("entryId");

-- CreateIndex
CREATE INDEX "jury_scores_entryId_idx" ON "jury_scores"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "jury_scores_entryId_juryId_key" ON "jury_scores"("entryId", "juryId");

-- CreateIndex
CREATE UNIQUE INDEX "system_scores_entryId_key" ON "system_scores"("entryId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contestants" ADD CONSTRAINT "contestants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contestant_images" ADD CONSTRAINT "contestant_images_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "contestants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jury_assignments" ADD CONSTRAINT "jury_assignments_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jury_assignments" ADD CONSTRAINT "jury_assignments_juryUserId_fkey" FOREIGN KEY ("juryUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "contestants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "contestants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_results" ADD CONSTRAINT "score_results_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "competition_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jury_scores" ADD CONSTRAINT "jury_scores_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "competition_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jury_scores" ADD CONSTRAINT "jury_scores_juryId_fkey" FOREIGN KEY ("juryId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_scores" ADD CONSTRAINT "system_scores_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "competition_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
