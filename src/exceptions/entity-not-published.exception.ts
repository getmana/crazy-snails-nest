import { DomainException } from './domain.exception';

export class EntityNotPublished extends DomainException {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}
