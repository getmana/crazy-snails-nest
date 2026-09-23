import { ErrorCodes } from 'src/constants/error-codes';

export class PreviewPhotoInvalidException extends Error {
  readonly code = ErrorCodes.PREVIEW_PHOTO_INVALID;

  constructor(message: string) {
    super(message);
    this.name = 'PreviewPhotoInvalidException';
  }
}
