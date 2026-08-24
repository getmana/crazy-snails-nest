/*
  Warnings:

  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeaturedImageStory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InlineImageStory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_album_id_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_country_id_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_photo_id_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_user_id_fkey";

-- DropForeignKey
ALTER TABLE "FeaturedImageStory" DROP CONSTRAINT "FeaturedImageStory_photo_id_fkey";

-- DropForeignKey
ALTER TABLE "FeaturedImageStory" DROP CONSTRAINT "FeaturedImageStory_story_id_fkey";

-- DropForeignKey
ALTER TABLE "InlineImageStory" DROP CONSTRAINT "InlineImageStory_photo_id_fkey";

-- DropForeignKey
ALTER TABLE "InlineImageStory" DROP CONSTRAINT "InlineImageStory_story_id_fkey";

-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_hero_image_id_fkey";

-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "hero_image_id" DROP NOT NULL;

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "FeaturedImageStory";

-- DropTable
DROP TABLE "InlineImageStory";

-- CreateTable
CREATE TABLE "GalleryImageStory" (
    "photo_id" INTEGER NOT NULL,
    "story_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GalleryImageStory_pkey" PRIMARY KEY ("photo_id","story_id")
);

-- CreateTable
CREATE TABLE "PairImageStory" (
    "photo_id" INTEGER NOT NULL,
    "story_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "PairImageStory_pkey" PRIMARY KEY ("photo_id","story_id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photo_id" INTEGER NOT NULL,
    "album_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "country_id" INTEGER,
    "description_en" TEXT,
    "description_uk" TEXT,
    "title_en" TEXT,
    "title_uk" TEXT,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GalleryImageStory_photo_id_idx" ON "GalleryImageStory"("photo_id");

-- CreateIndex
CREATE INDEX "GalleryImageStory_story_id_idx" ON "GalleryImageStory"("story_id");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryImageStory_story_id_position_key" ON "GalleryImageStory"("story_id", "position");

-- CreateIndex
CREATE INDEX "PairImageStory_photo_id_idx" ON "PairImageStory"("photo_id");

-- CreateIndex
CREATE INDEX "PairImageStory_story_id_idx" ON "PairImageStory"("story_id");

-- CreateIndex
CREATE UNIQUE INDEX "PairImageStory_story_id_position_key" ON "PairImageStory"("story_id", "position");

-- CreateIndex
CREATE INDEX "Note_photo_id_idx" ON "Note"("photo_id");

-- CreateIndex
CREATE INDEX "Note_album_id_idx" ON "Note"("album_id");

-- CreateIndex
CREATE INDEX "Note_user_id_idx" ON "Note"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Note_photo_id_album_id_key" ON "Note"("photo_id", "album_id");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_hero_image_id_fkey" FOREIGN KEY ("hero_image_id") REFERENCES "Photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImageStory" ADD CONSTRAINT "GalleryImageStory_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImageStory" ADD CONSTRAINT "GalleryImageStory_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairImageStory" ADD CONSTRAINT "PairImageStory_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairImageStory" ADD CONSTRAINT "PairImageStory_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
