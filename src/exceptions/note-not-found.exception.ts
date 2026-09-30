import { ErrorCodes } from 'src/constants/error-codes';

export class NoteNotFoundException extends Error {
  readonly code = ErrorCodes.NOTE_NOT_FOUND;

  constructor(message: string) {
    super(message);
    this.name = 'NoteNotFoundException';
  }
}
