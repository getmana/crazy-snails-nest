import { ErrorCodes } from 'src/constants/error-codes';

export class PhotoNotOwnedException extends Error {
  readonly code = ErrorCodes.PHOTO_NOT_OWNED;

  constructor(message: string) {
    super(message);
    this.name = 'PhotoNotOwnedException';
  }
}
