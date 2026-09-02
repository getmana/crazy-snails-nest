import { ErrorCodes } from 'src/constants/error-codes';

export class StoryNotFoundException extends Error {
  readonly code = ErrorCodes.STORY_NOT_FOUND;

  constructor(message: string) {
    super(message);
    this.name = 'StoryNotFoundException';
  }
}
