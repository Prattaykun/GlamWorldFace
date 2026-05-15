-- AlterTable
ALTER TABLE "competitions" ADD COLUMN     "scoringCriteria" TEXT,
ADD COLUMN     "scoringThresholds" JSONB;
