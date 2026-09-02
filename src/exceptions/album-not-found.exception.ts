import { ErrorCodes } from 'src/constants/error-codes';

export class AlbumNotFoundException extends Error {
  readonly code = ErrorCodes.ALBUM_NOT_FOUND;

  constructor(message: string) {
    super(message);
    this.name = 'AlbumNotFoundException';
  }
}
