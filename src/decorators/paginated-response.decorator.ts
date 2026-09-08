import { ApiResponse } from '@nestjs/swagger';

export const ApiPaginatedResponse = (description: string) =>
  ApiResponse({
    status: 200,
    description,
    schema: {
      properties: {
        items: { type: 'array', items: { type: 'object' } },
        nextCursor: { type: 'number', nullable: true },
      },
    },
  });
