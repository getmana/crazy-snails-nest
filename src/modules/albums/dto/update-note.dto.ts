import { z } from 'zod';
import { TiptapDocumentSchema } from 'src/dto/tiptap.dto';
import { type OptionalProperty } from 'src/utils';

export const UpdateNoteSchema = z.object({
  country: z.number().nullable().optional(),
  title: z.string().min(1).nullable().optional(),
  titleEn: z.string().nullable().optional(),
  titleUk: z.string().nullable().optional(),
  description: TiptapDocumentSchema,
  descriptionEn: TiptapDocumentSchema.optional().nullable(),
  descriptionUk: TiptapDocumentSchema.optional().nullable(),
  date: z.coerce.date().nullable().optional(),
});

export type UpdateNotePayload = z.infer<typeof UpdateNoteSchema>;

export type NoteContextDto = {
  albumId: number;
  photoId: number;
  userId: number;
};

export type UpdateNoteDto = UpdateNotePayload & NoteContextDto;

export type GetNoteDto = OptionalProperty<NoteContextDto, 'userId'>;
