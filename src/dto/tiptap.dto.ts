import { z } from 'zod';

export const TiptapDocumentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(z.any()),
});
