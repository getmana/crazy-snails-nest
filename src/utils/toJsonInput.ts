import { Prisma } from '@prisma/client';
import { type TiptapDocument } from 'src/dto';

export const toJsonInput = (
  v: TiptapDocument | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined => {
  if (v === null) return Prisma.JsonNull;
  if (v === undefined) return undefined;
  return v as unknown as Prisma.InputJsonValue;
};
