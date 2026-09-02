export class EntityNotPublished extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'EntityNotPublished';
  }
}
