import { ErrorCodes } from 'src/constants/error-codes';

export class TokenGenerationFailedException extends Error {
  static readonly code = ErrorCodes.TOKEN_GENERATION_FAILED;

  constructor(message: string) {
    super(message);
    this.name = 'TokenGenerationFailedException';
  }
}
