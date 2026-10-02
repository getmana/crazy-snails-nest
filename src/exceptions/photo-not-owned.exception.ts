import { ErrorCodes } from 'src/constants/error-codes';
import { DomainException } from './domain.exception';

export class PhotoNotOwnedException extends DomainException {
  readonly code = ErrorCodes.PHOTO_NOT_OWNED;

  constructor(message: string) {
    super(message);
  }
}
