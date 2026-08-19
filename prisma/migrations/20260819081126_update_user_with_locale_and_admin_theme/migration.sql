-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'uk');

-- CreateEnum
CREATE TYPE "AdminTheme" AS ENUM ('dark', 'light');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "admin_theme" "AdminTheme" NOT NULL DEFAULT 'light',
ADD COLUMN     "locale" "Locale" NOT NULL DEFAULT 'uk';
