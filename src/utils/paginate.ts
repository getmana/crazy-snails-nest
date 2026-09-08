import { Prisma } from '@prisma/client';

export function buildPaginatedResponse<T extends { id: number }>(
  raw: T[],
  limit: number,
): { items: T[]; nextCursor: number | null } {
  const hasNextPage = raw.length > limit;
  const items = hasNextPage ? raw.slice(0, -1) : raw;
  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
  };
}

export function buildPaginationArgs(cursor: number | undefined, limit: number) {
  return {
    orderBy: { id: 'desc' as const },
    take: limit + 1,
    ...(cursor !== undefined && {
      cursor: { id: cursor },
      skip: 1,
    }),
  };
}

export async function findManyPaginated<T extends { id: number }>(
  query: () => Promise<T[]>,
  limit: number,
): Promise<{ items: T[]; nextCursor: number | null }> {
  try {
    const raw = await query();
    return buildPaginatedResponse(raw, limit);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2025'
    ) {
      return { items: [], nextCursor: null };
    }
    throw e;
  }
}
