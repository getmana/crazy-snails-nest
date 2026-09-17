import { z } from 'zod';
import { TiptapDocumentSchema } from 'src/dto/tiptap.dto';

export const CarouselPhoto = z.object({
  photoId: z.number().int(),
  caption: z.string().optional(),
  captionEn: z.string().optional(),
  captionUk: z.string().optional(),
});

export const UpdateStorySchema = z
  .object({
    title: z.string().min(1).optional(),
    titleEn: z.string().optional(),
    titleUk: z.string().optional(),
    subtitle: z.string().optional(),
    subtitleEn: z.string().optional(),
    subtitleUk: z.string().optional(),
    description: TiptapDocumentSchema.optional().nullable(),
    descriptionEn: TiptapDocumentSchema.optional().nullable(),
    descriptionUk: TiptapDocumentSchema.optional().nullable(),
    heroFirst: z.boolean().optional(),
    heroImageId: z.number().int().nullable().optional(),
    pairPhotoIds: z.array(z.number().int()).max(2).optional(),
    galleryPhotoIds: z.array(z.number().int()).optional(),
    carouselPhotos: z.array(CarouselPhoto).optional(),
    isPublished: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const allIds = [
        ...(data.heroImageId != null ? [data.heroImageId] : []),
        ...(data.pairPhotoIds ?? []),
        ...(data.galleryPhotoIds ?? []),
        ...(data.carouselPhotos?.map(({ photoId }) => photoId) ?? []),
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
