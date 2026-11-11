import { ErrorCodes } from 'src/constants';
import { InfrastructureException } from './infrastructure.exception';

export class FileWriteException extends InfrastructureException {
  readonly code = ErrorCodes.FILE_WRITE_TO_STORAGE_ERROR;
}
