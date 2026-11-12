import { type ErrorCode } from 'src/constants';

export abstract class DomainException extends Error {
  abstract readonly code: ErrorCode;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
