import { z } from 'zod';

export function zodToApiSchema(schema: z.ZodType): object {
  return z.toJSONSchema(schema, {
    unrepresentable: 'any',
    override: ({ zodSchema, jsonSchema }) => {
      if (zodSchema instanceof z.ZodDate) {
        Object.assign(jsonSchema, { type: 'string', format: 'date-time' });
      }
    },
  }) as object;
}
