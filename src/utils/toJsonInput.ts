import { Prisma } from '@prisma/client';

export const toJsonInput = (
  v: { type: string; content: any[] } | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined => {
  if (v === null) return Prisma.JsonNull;
  if (v === undefined) return undefined;
  return v as unknown as Prisma.InputJsonValue;
};
