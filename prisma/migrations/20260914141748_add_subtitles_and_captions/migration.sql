-- AlterTable
ALTER TABLE "Album" ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "subtitle_en" TEXT,
ADD COLUMN     "subtitle_uk" TEXT;

-- AlterTable
ALTER TABLE "CarouselStory" ADD COLUMN     "caption" TEXT,
ADD COLUMN     "caption_en" TEXT,
ADD COLUMN     "caption_uk" TEXT;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "subtitle_en" TEXT,
ADD COLUMN     "subtitle_uk" TEXT;
