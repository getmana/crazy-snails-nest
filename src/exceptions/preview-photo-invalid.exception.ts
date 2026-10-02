import { ErrorCodes } from 'src/constants/error-codes';
import { DomainException } from './domain.exception';

export class PreviewPhotoInvalidException extends DomainException {
  readonly code = ErrorCodes.PREVIEW_PHOTO_INVALID;

  constructor(message: string) {
    super(message);
  }
}
