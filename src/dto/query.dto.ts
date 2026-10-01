import { PaginationPayload } from './pagination.dto';

export type GetUserAlbumsDto = PaginationPayload & {
  userId: number;
  publishedOnly: boolean;
};

export type GetUserStoriesDto = PaginationPayload & {
  userId: number;
  publishedOnly: boolean;
};
