import { ErrorCodes } from 'src/constants';
import { DomainException } from './domain.exception';

export class UserAlreadyExistsException extends DomainException {
  readonly code = ErrorCodes.USER_EXISTS;

  constructor(message: string) {
    super(message);
  }
}
