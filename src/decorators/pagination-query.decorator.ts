import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export const ApiPaginationQuery = () =>
  applyDecorators(
    ApiQuery({
      name: 'cursor',
      required: false,
      type: Number,
      description: 'Last seen item ID',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default 20, max 100)',
    }),
  );
