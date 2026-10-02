import { ErrorCodes } from 'src/constants/error-codes';
import { DomainException } from './domain.exception';

export class FileWriteException extends DomainException {
  readonly code = ErrorCodes.FILE_WRITE_TO_STORAGE_ERROR;

  constructor(message: string) {
    super(message);
  }
}
