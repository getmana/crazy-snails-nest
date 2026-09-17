/*
  Warnings:

  - The `description` column on the `Album` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description_en` column on the `Album` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description_uk` column on the `Album` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description_en` column on the `Note` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description_uk` column on the `Note` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `description` on the `Note` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Album" DROP COLUMN "description",
ADD COLUMN     "description" JSONB,
DROP COLUMN "description_en",
ADD COLUMN     "description_en" JSONB,
DROP COLUMN "description_uk",
ADD COLUMN     "description_uk" JSONB;

-- AlterTable
ALTER TABLE "Note" ALTER COLUMN "title" DROP NOT NULL,
DROP COLUMN "description",
ADD COLUMN     "description" JSONB NOT NULL,
DROP COLUMN "description_en",
ADD COLUMN     "description_en" JSONB,
DROP COLUMN "description_uk",
ADD COLUMN     "description_uk" JSONB,
ALTER COLUMN "date" DROP NOT NULL;
