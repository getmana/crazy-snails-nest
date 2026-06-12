/*
  Warnings:

  - You are about to drop the column `preview_image_url` on the `Album` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `hero_image_url` on the `Story` table. All the data in the column will be lost.
  - Added the required column `preview_image_id` to the `Album` table without a default value. This is not possible if the table is not empty.
  - Added the required column `original_key` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hero_image_id` to the `Story` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pending', 'ready', 'failed');

-- AlterTable
ALTER TABLE "Album" DROP COLUMN "preview_image_url",
ADD COLUMN     "preview_image_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "url",
ADD COLUMN     "original_key" TEXT NOT NULL,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'pending',
ADD COLUMN     "thumbnail_md_key" TEXT,
ADD COLUMN     "thumbnail_sm_key" TEXT;

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "hero_image_url",
ADD COLUMN     "hero_image_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_preview_image_id_fkey" FOREIGN KEY ("preview_image_id") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_hero_image_id_fkey" FOREIGN KEY ("hero_image_id") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
