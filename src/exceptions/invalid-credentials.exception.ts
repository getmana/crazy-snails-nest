import { ErrorCodes } from 'src/constants/error-codes';
import { DomainException } from './domain.exception';

export class InvalidCredentialsException extends DomainException {
  readonly code = ErrorCodes.INVALID_CREDENTIALS;

  constructor(message: string) {
    super(message);
  }
}
