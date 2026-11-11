import { ErrorCodes } from 'src/constants/error-codes';
import { InfrastructureException } from './infrastructure.exception';

export class TokenGenerationFailedException extends InfrastructureException {
  readonly code = ErrorCodes.TOKEN_GENERATION_FAILED;
}
