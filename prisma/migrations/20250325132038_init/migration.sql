-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'editor');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'editor',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "preview_image_url" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "display_in_landing_mode" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoAlbum" (
    "album_id" INTEGER NOT NULL,
    "photo_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "PhotoAlbum_pkey" PRIMARY KEY ("album_id","photo_id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "hero_image_url" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hero_first" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedImageStory" (
    "photo_id" INTEGER NOT NULL,
    "story_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "FeaturedImageStory_pkey" PRIMARY KEY ("photo_id","story_id")
);

-- CreateTable
CREATE TABLE "InlineImageStory" (
    "photo_id" INTEGER NOT NULL,
    "story_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "InlineImageStory_pkey" PRIMARY KEY ("photo_id","story_id")
);

-- CreateTable
CREATE TABLE "CarouselStory" (
    "photo_id" INTEGER NOT NULL,
    "story_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CarouselStory_pkey" PRIMARY KEY ("photo_id","story_id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "country" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photo_id" INTEGER NOT NULL,
    "album_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Album_user_id_idx" ON "Album"("user_id");

-- CreateIndex
CREATE INDEX "Photo_user_id_idx" ON "Photo"("user_id");

-- CreateIndex
CREATE INDEX "PhotoAlbum_album_id_idx" ON "PhotoAlbum"("album_id");

-- CreateIndex
CREATE INDEX "PhotoAlbum_photo_id_idx" ON "PhotoAlbum"("photo_id");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoAlbum_album_id_position_key" ON "PhotoAlbum"("album_id", "position");

-- CreateIndex
CREATE INDEX "Story_user_id_idx" ON "Story"("user_id");

-- CreateIndex
CREATE INDEX "FeaturedImageStory_photo_id_idx" ON "FeaturedImageStory"("photo_id");

-- CreateIndex
CREATE INDEX "FeaturedImageStory_story_id_idx" ON "FeaturedImageStory"("story_id");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedImageStory_story_id_position_key" ON "FeaturedImageStory"("story_id", "position");

-- CreateIndex
CREATE INDEX "InlineImageStory_photo_id_idx" ON "InlineImageStory"("photo_id");

-- CreateIndex
CREATE INDEX "InlineImageStory_story_id_idx" ON "InlineImageStory"("story_id");

-- CreateIndex
CREATE UNIQUE INDEX "InlineImageStory_story_id_position_key" ON "InlineImageStory"("story_id", "position");

-- CreateIndex
CREATE INDEX "CarouselStory_photo_id_idx" ON "CarouselStory"("photo_id");

-- CreateIndex
CREATE INDEX "CarouselStory_story_id_idx" ON "CarouselStory"("story_id");

-- CreateIndex
CREATE UNIQUE INDEX "CarouselStory_story_id_position_key" ON "CarouselStory"("story_id", "position");

-- CreateIndex
CREATE INDEX "Comment_photo_id_idx" ON "Comment"("photo_id");

-- CreateIndex
CREATE INDEX "Comment_album_id_idx" ON "Comment"("album_id");

-- CreateIndex
CREATE INDEX "Comment_user_id_idx" ON "Comment"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_photo_id_album_id_key" ON "Comment"("photo_id", "album_id");

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoAlbum" ADD CONSTRAINT "PhotoAlbum_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoAlbum" ADD CONSTRAINT "PhotoAlbum_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedImageStory" ADD CONSTRAINT "FeaturedImageStory_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedImageStory" ADD CONSTRAINT "FeaturedImageStory_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlineImageStory" ADD CONSTRAINT "InlineImageStory_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlineImageStory" ADD CONSTRAINT "InlineImageStory_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselStory" ADD CONSTRAINT "CarouselStory_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselStory" ADD CONSTRAINT "CarouselStory_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
