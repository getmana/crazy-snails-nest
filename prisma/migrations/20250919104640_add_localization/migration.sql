/*
  Warnings:

  - You are about to drop the column `name` on the `Country` table. All the data in the column will be lost.
  - You are about to drop the column `display_in_landing_mode` on the `Photo` table. All the data in the column will be lost.
  - Added the required column `name_en` to the `Country` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name_uk` to the `Country` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Album" ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "description_uk" TEXT,
ADD COLUMN     "title_en" TEXT,
ADD COLUMN     "title_uk" TEXT;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "description_uk" TEXT,
ADD COLUMN     "title_en" TEXT,
ADD COLUMN     "title_uk" TEXT;

-- AlterTable
ALTER TABLE "Country" DROP COLUMN "name",
ADD COLUMN     "name_en" TEXT NOT NULL,
ADD COLUMN     "name_uk" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "display_in_landing_mode",
ADD COLUMN     "display_in_story_mode" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "description_uk" TEXT,
ADD COLUMN     "title_en" TEXT,
ADD COLUMN     "title_uk" TEXT;
