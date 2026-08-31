-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "description" DROP NOT NULL;
