import { getErrorMessage } from 'src/utils';
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
      .string()
      .transform((val) => {
        try {
          const parsed = JSON.parse(val) as { code: string }[];
          if (!Array.isArray(parsed)) {
            throw new Error('Countries must be an array');
          }
          return parsed;
        } catch (e: unknown) {
          throw new Error(
            `Invalid JSON format for countries: ${getErrorMessage(e)}`,
          );
        }
      })
      .pipe(
        z
          .array(
            z.object({
              code: z.string().min(1, 'Country code must not be empty'),
            }),
          )
          .min(1, 'At least one country is required')
          .max(5, 'Maximum 5 countries allowed')
          .refine((countries) => countries.some((c) => c.code.length > 0), {
            message: 'At least one country must be selected',
          }),
      ),
    startDate: z.string().pipe(z.coerce.date()),
    endDate: z.string().pipe(z.coerce.date()),
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
  previewImageUrl: string;
  countryIds: number[];
  userId: number;
};
