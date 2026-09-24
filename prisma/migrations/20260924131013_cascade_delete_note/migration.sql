-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_album_id_fkey";

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;
