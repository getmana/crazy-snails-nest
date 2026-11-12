import { type ErrorCode } from 'src/constants';
import { DomainException } from './domain.exception';

export class EntityNotPublished extends DomainException {
  constructor(
    message: string,
    readonly code: ErrorCode,
  ) {
    super(message);
  }
}
