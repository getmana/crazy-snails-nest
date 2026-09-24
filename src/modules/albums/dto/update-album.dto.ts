import { z } from 'zod';
import { TiptapDocumentSchema } from 'src/dto/tiptap.dto';
import { prismaEnumValues } from 'src/utils';
import { ActivityType } from '@prisma/client';

export const UpdateAlbumSchema = z
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
    isPublished: z.boolean().optional(),
    countries: z
      .array(z.number())
      .min(1, 'At least one country is required')
      .max(5, 'Maximum 5 countries allowed')
      .optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    activityTypes: z
      .array(z.enum(prismaEnumValues(ActivityType)))
      .min(1, 'At least one activity type is required')
      .optional(),
    previewImageId: z.number().int().optional(),
    albumPhotoIds: z
      .array(z.number().int())
      .optional()
      .describe(
        'Full replacement of album photo list. Omit to leave unchanged. Send [] to remove all photos.',
      ),
  })
  .refine(
    (data) => {
      if (!data.albumPhotoIds) {
        return true;
      }
      return new Set(data.albumPhotoIds).size === data.albumPhotoIds.length;
    },
    { message: 'Photo IDs must be unique across the whole album' },
  )
  .refine(
    (data) => {
      if (!data.albumPhotoIds || data.previewImageId === undefined) {
        return true;
      }
      return data.albumPhotoIds.includes(data.previewImageId);
    },
    { message: 'Preview Photo must be included into the album' },
  );

export type UpdateAlbumPayload = z.infer<typeof UpdateAlbumSchema>;

export type UpdateAlbumDto = UpdateAlbumPayload & {
  id: number;
  userId: number;
};
