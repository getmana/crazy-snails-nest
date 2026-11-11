import { ErrorCodes } from 'src/constants';
import { DomainException } from './domain.exception';

export class NoteNotFoundException extends DomainException {
  readonly code = ErrorCodes.NOTE_NOT_FOUND;

  constructor(message: string) {
    super(message);
  }
}
