import { ErrorCodes } from 'src/constants/error-codes';
import { DomainException } from './domain.exception';

export class TokenGenerationFailedException extends DomainException {
  readonly code = ErrorCodes.TOKEN_GENERATION_FAILED;

  constructor(message: string) {
    super(message);
  }
}
