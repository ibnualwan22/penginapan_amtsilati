/*
  Warnings:

  - You are about to drop the column `lateFeeFullDay` on the `PropertySettings` table. All the data in the column will be lost.
  - You are about to drop the column `lateFeeHalfDay` on the `PropertySettings` table. All the data in the column will be lost.
  - You are about to drop the column `lateFeePerHour` on the `PropertySettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PropertySettings" DROP COLUMN "lateFeeFullDay",
DROP COLUMN "lateFeeHalfDay",
DROP COLUMN "lateFeePerHour";

-- AlterTable
ALTER TABLE "RoomType" ADD COLUMN     "lateFeeFullDay" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "lateFeeHalfDay" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "lateFeePerHour" DECIMAL(65,30) NOT NULL DEFAULT 20000;
