-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('hiking', 'tracking', 'cycling', 'auto', 'motorcycle', 'city');

-- DropForeignKey
ALTER TABLE "Album" DROP CONSTRAINT "Album_preview_image_id_fkey";

-- AlterTable
ALTER TABLE "Album" ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "preview_image_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AlbumActivity" (
    "album_id" INTEGER NOT NULL,
    "activity_type" "ActivityType" NOT NULL,

    CONSTRAINT "AlbumActivity_pkey" PRIMARY KEY ("album_id","activity_type")
);

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_preview_image_id_fkey" FOREIGN KEY ("preview_image_id") REFERENCES "Photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumActivity" ADD CONSTRAINT "AlbumActivity_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
