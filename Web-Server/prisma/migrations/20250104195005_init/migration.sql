/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Coordinate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Coordinate" DROP COLUMN "updatedAt",
ALTER COLUMN "priority" DROP DEFAULT;
