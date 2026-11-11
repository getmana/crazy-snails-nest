import { ErrorCodes } from 'src/constants';
import { DomainException } from './domain.exception';

export class PreviewPhotoInvalidException extends DomainException {
  readonly code = ErrorCodes.PREVIEW_PHOTO_INVALID;

  constructor(message: string) {
    super(message);
  }
}
