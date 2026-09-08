import { z } from 'zod';

export const PaginationSchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationPayload = z.infer<typeof PaginationSchema>;
