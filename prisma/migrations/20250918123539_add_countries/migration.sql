/*
  Warnings:

  - You are about to drop the column `country` on the `Album` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Comment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[country_id]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Album" DROP COLUMN "country";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "country",
ADD COLUMN     "country_id" INTEGER;

-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryAlbum" (
    "country_id" INTEGER NOT NULL,
    "album_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CountryAlbum_pkey" PRIMARY KEY ("country_id","album_id")
);

-- CreateIndex
CREATE INDEX "CountryAlbum_country_id_idx" ON "CountryAlbum"("country_id");

-- CreateIndex
CREATE INDEX "CountryAlbum_album_id_idx" ON "CountryAlbum"("album_id");

-- CreateIndex
CREATE UNIQUE INDEX "CountryAlbum_album_id_position_key" ON "CountryAlbum"("album_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_country_id_key" ON "Comment"("country_id");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryAlbum" ADD CONSTRAINT "CountryAlbum_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryAlbum" ADD CONSTRAINT "CountryAlbum_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
