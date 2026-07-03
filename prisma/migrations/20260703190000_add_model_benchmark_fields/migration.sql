-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "allModelIds" JSONB,
ADD COLUMN     "chosenModelId" TEXT,
ADD COLUMN     "chosenModelLabel" TEXT,
ADD COLUMN     "planClarity" INTEGER,
ADD COLUMN     "planPersonalization" INTEGER,
ADD COLUMN     "wouldFollowPlan" BOOLEAN;
