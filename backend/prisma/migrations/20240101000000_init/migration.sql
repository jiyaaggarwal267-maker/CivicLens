-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'AUTHORITY');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('POTHOLE', 'STREETLIGHT', 'GARBAGE', 'WATER_LEAKAGE', 'DAMAGED_FOOTPATH', 'OPEN_DRAIN', 'OTHER');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TrafficExposure" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'LIKELY_RESOLVED', 'UNCLEAR', 'NOT_RESOLVED');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('ROAD_MAINTENANCE', 'SANITATION', 'ELECTRICAL', 'WATER_WORKS', 'PARKS_HORTICULTURE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CivicIssue" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "description" TEXT,
    "severity" "Severity" NOT NULL,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "priorityLevel" TEXT NOT NULL DEFAULT 'LOW',
    "trafficExposure" "TrafficExposure" NOT NULL DEFAULT 'MEDIUM',
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "department" "Department",
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CivicIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "userId" TEXT,
    "reporterName" TEXT NOT NULL DEFAULT 'Anonymous Citizen',
    "imageUrl" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "aiCategory" "Category" NOT NULL,
    "aiSeverity" "Severity" NOT NULL,
    "aiConfidence" DOUBLE PRECISION NOT NULL,
    "embedding" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resolution" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "beforeImageUrl" TEXT NOT NULL,
    "afterImageUrl" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verificationNotes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitizenFeedback" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "userId" TEXT,
    "resolved" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitizenFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueEvent" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CivicIssue_code_key" ON "CivicIssue"("code");

-- CreateIndex
CREATE INDEX "CivicIssue_status_idx" ON "CivicIssue"("status");

-- CreateIndex
CREATE INDEX "CivicIssue_priorityScore_idx" ON "CivicIssue"("priorityScore");

-- CreateIndex
CREATE INDEX "Report_issueId_idx" ON "Report"("issueId");

-- CreateIndex
CREATE INDEX "Resolution_issueId_idx" ON "Resolution"("issueId");

-- CreateIndex
CREATE INDEX "CitizenFeedback_issueId_idx" ON "CitizenFeedback"("issueId");

-- CreateIndex
CREATE INDEX "IssueEvent_issueId_idx" ON "IssueEvent"("issueId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CivicIssue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resolution" ADD CONSTRAINT "Resolution_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CivicIssue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenFeedback" ADD CONSTRAINT "CitizenFeedback_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CivicIssue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenFeedback" ADD CONSTRAINT "CitizenFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueEvent" ADD CONSTRAINT "IssueEvent_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CivicIssue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- PostGIS: geography column kept in sync with latitude/longitude, used for
-- ST_DWithin proximity queries in duplicate detection and map bounding-box
-- lookups (see src/services/geoService.ts). Not modeled in schema.prisma
-- (Prisma has no native geography type) — accessed only via raw SQL.
ALTER TABLE "CivicIssue" ADD COLUMN "location" geography(Point, 4326);

CREATE INDEX "CivicIssue_location_idx" ON "CivicIssue" USING GIST ("location");

UPDATE "CivicIssue" SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography;

CREATE OR REPLACE FUNCTION civiclens_sync_issue_location() RETURNS trigger AS $$
BEGIN
  NEW."location" := ST_SetSRID(ST_MakePoint(NEW."longitude", NEW."latitude"), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER civiclens_civicissue_location_sync
BEFORE INSERT OR UPDATE OF "latitude", "longitude" ON "CivicIssue"
FOR EACH ROW EXECUTE FUNCTION civiclens_sync_issue_location();
