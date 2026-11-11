import { ErrorCodes } from 'src/constants';
import { DomainException } from './domain.exception';

export class AlbumNotFoundException extends DomainException {
  readonly code = ErrorCodes.ALBUM_NOT_FOUND;

  constructor(message: string) {
    super(message);
  }
}
