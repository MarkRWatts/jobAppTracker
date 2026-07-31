-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('PERMANENT', 'CONTRACT');

-- CreateEnum
CREATE TYPE "IR35Status" AS ENUM ('INSIDE', 'OUTSIDE', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "dayRate" TEXT,
ADD COLUMN     "employmentType" "EmploymentType" NOT NULL DEFAULT 'PERMANENT',
ADD COLUMN     "ir35Status" "IR35Status";
