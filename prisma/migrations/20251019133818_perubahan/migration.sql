/*
  Warnings:

  - A unique constraint covering the columns `[name,propertyId]` on the table `RoomType` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RoomType_name_propertyId_key" ON "RoomType"("name", "propertyId");
