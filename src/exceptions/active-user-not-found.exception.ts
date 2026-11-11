import { ErrorCodes } from 'src/constants';
import { DomainException } from './domain.exception';

export class ActiveUserNotFoundException extends DomainException {
  readonly code = ErrorCodes.USER_NOT_FOUND;

  constructor(message: string) {
    super(message);
  }
}
