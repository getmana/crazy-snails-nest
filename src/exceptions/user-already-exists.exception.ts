import { ErrorCodes } from 'src/constants/error-codes';
import { DomainException } from './domain.exception';

export class UserAlreadyExistsException extends DomainException {
  readonly code = ErrorCodes.USER_EXIST;

  constructor(message: string) {
    super(message);
  }
}
