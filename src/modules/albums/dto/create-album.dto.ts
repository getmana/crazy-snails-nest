import { z } from 'zod';

export const CreateAlbumSchema = z
  .object({
    title: z.string().min(1, 'Title must be at least 1 character'),
    titleEn: z.string().optional(),
    titleUk: z.string().optional(),
    description: z.string().min(1, 'Description must be at least 1 character'),
    descriptionEn: z.string().optional(),
    descriptionUk: z.string().optional(),
    countries: z
      .array(
        z.object({
          code: z.string().min(1, 'Country code must not be empty'),
        }),
      )
      .min(1, 'At least one country is required')
      .max(5, 'Maximum 5 countries allowed'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    previewImageUrl: z.string(),
  })
  .refine((data) => data.titleEn || data.titleUk, {
    message: 'At least one of titleEn or titleUk must be provided',
    path: ['titleEn', 'titleUk'],
  })
  .refine((data) => data.descriptionEn || data.descriptionUk, {
    message: 'At least one of descriptionEn or descriptionUk must be provided',
    path: ['descriptionEn', 'descriptionUk'],
  });

export type CreateAlbumPayload = z.infer<typeof CreateAlbumSchema>;

export type CreateAlbumDto = Omit<CreateAlbumPayload, 'countries'> & {
  countryIds: number[];
  userId: number;
};
