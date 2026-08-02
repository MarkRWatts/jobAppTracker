/*
  Warnings:

  - Made the column `userId` on table `Application` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Company` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "userId" SET NOT NULL;
