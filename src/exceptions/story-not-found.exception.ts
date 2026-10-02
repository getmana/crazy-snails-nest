import { ErrorCodes } from 'src/constants/error-codes';
import { DomainException } from './domain.exception';

export class StoryNotFoundException extends DomainException {
  readonly code = ErrorCodes.STORY_NOT_FOUND;

  constructor(message: string) {
    super(message);
  }
}
