-- DropForeignKey
ALTER TABLE "AlbumActivity" DROP CONSTRAINT "AlbumActivity_album_id_fkey";

-- DropForeignKey
ALTER TABLE "CarouselStory" DROP CONSTRAINT "CarouselStory_story_id_fkey";

-- DropForeignKey
ALTER TABLE "CountryAlbum" DROP CONSTRAINT "CountryAlbum_album_id_fkey";

-- DropForeignKey
ALTER TABLE "GalleryImageStory" DROP CONSTRAINT "GalleryImageStory_story_id_fkey";

-- DropForeignKey
ALTER TABLE "PairImageStory" DROP CONSTRAINT "PairImageStory_story_id_fkey";

-- DropForeignKey
ALTER TABLE "PhotoAlbum" DROP CONSTRAINT "PhotoAlbum_album_id_fkey";

-- AddForeignKey
ALTER TABLE "PhotoAlbum" ADD CONSTRAINT "PhotoAlbum_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumActivity" ADD CONSTRAINT "AlbumActivity_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImageStory" ADD CONSTRAINT "GalleryImageStory_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairImageStory" ADD CONSTRAINT "PairImageStory_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselStory" ADD CONSTRAINT "CarouselStory_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryAlbum" ADD CONSTRAINT "CountryAlbum_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;
