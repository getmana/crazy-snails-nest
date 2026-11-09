import { ErrorCodes } from 'src/constants/error-codes';
import { DomainException } from './domain.exception';

export class StoryPhotoDuplicatedException extends DomainException {
  readonly code = ErrorCodes.STORY_PHOTO_DUPLICATED;

  constructor(message: string) {
    super(message);
  }
}
