import { Status } from '@prisma/client';

export type CreatePhotoDto = {
  photoId: number;
  originalUrl: string;
  status: Status;
  thumbnailSmUrl: string | null;
  thumbnailMdUrl: string | null;
};
