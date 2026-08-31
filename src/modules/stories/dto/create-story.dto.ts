import { z } from 'zod';

export const CreateStorySchema = z
  .object({
    title: z.string().min(1, 'Title must be at least 1 character'),
    titleEn: z.string().optional(),
    titleUk: z.string().optional(),
  })
  .refine((data) => data.titleEn || data.titleUk, {
    message: 'At least one of titleEn or titleUk must be provided',
  });

export type CreateStoryPayload = z.infer<typeof CreateStorySchema>;

export type CreateStoryDto = CreateStoryPayload & {
  userId: number;
};
