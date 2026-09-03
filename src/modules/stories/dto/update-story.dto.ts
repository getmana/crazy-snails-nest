import { z } from 'zod';

export const UpdateStorySchema = z
  .object({
    title: z.string().min(1).optional(),
    titleEn: z.string().optional(),
    titleUk: z.string().optional(),
    description: z.string().optional(),
    descriptionEn: z.string().optional(),
    descriptionUk: z.string().optional(),
    heroFirst: z.boolean().optional(),
    heroImageId: z.number().int().nullable().optional(),
    pairPhotoIds: z.array(z.number().int()).max(2).optional(),
    galleryPhotoIds: z.array(z.number().int()).optional(),
    carouselPhotoIds: z.array(z.number().int()).optional(),
    isPublished: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const allIds = [
        ...(data.heroImageId != null ? [data.heroImageId] : []),
        ...(data.pairPhotoIds ?? []),
        ...(data.galleryPhotoIds ?? []),
        ...(data.carouselPhotoIds ?? []),
      ];
      return new Set(allIds).size === allIds.length;
    },
    { message: 'Photo IDs must be unique across all image sections' },
  );

export type UpdateStoryPayload = z.infer<typeof UpdateStorySchema>;

export type UpdateStoryDto = UpdateStoryPayload & {
  id: number;
  userId: number;
};
