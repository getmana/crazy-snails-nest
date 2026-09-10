/*
  Warnings:

  - The `description` column on the `Story` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description_en` column on the `Story` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description_uk` column on the `Story` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Story" DROP COLUMN "description",
ADD COLUMN     "description" JSONB,
DROP COLUMN "description_en",
ADD COLUMN     "description_en" JSONB,
DROP COLUMN "description_uk",
ADD COLUMN     "description_uk" JSONB;
