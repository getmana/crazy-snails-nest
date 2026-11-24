import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import { join } from 'path';
import { FILE_UPLOAD_URL } from 'src/constants';

const prisma = new PrismaClient();

const isMissingFileError = (error: unknown) =>
  error instanceof Error && 'code' in error && error.code === 'ENOENT';

const readFileSize = async (key: string): Promise<number | null> => {
  try {
    const { size } = await fs.stat(join(process.cwd(), FILE_UPLOAD_URL, key));
    return size;
  } catch (error: unknown) {
    if (isMissingFileError(error)) return null;
    throw error;
  }
};

const backfillPhotoSizes = async () => {
  const photos = await prisma.photo.findMany({
    where: { size_bytes: null },
    select: { id: true, original_key: true },
    orderBy: { id: 'asc' },
  });

  const missingKeys: string[] = [];
  let updatedCount = 0;

  for (const photo of photos) {
    const size = await readFileSize(photo.original_key);
    if (size === null) {
      missingKeys.push(photo.original_key);
      continue;
    }
    await prisma.photo.update({
      where: { id: photo.id },
      data: { size_bytes: size },
    });
    updatedCount++;
  }

  console.log(`Photos without size: ${photos.length}`);
  console.log(`Updated: ${updatedCount}`);
  if (missingKeys.length > 0) {
    console.warn(`File missing on disk, left empty: ${missingKeys.length}`);
    missingKeys.forEach((key) => console.warn(`  ${key}`));
  }
};

backfillPhotoSizes()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
