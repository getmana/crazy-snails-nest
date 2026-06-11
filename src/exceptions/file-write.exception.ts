import { ErrorCodes } from 'src/constants/error-codes';

export class FileWriteException extends Error {
  static readonly code = ErrorCodes.FILE_WRITE_TO_STORAGE_ERROR;

  constructor(message: string) {
    super(message);
    this.name = 'FileWriteException';
  }
}
