import { ErrorCodes } from 'src/constants/error-codes';

export class UserAlreadyExistsException extends Error {
  static readonly code = ErrorCodes.USER_NOT_FOUND;

  constructor(message: string) {
    super(message);
    this.name = 'UserAlreadyExistsException';
  }
}
