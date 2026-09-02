import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { AlbumNotFoundException } from 'src/exceptions/album-not-found.exception';
import { EntityNotPublished } from 'src/exceptions/entity-not-published.exception';
import { StoryNotFoundException } from 'src/exceptions/story-not-found.exception';
import { Response } from 'express';

@Catch(AlbumNotFoundException, StoryNotFoundException, EntityNotPublished)
export class NotFoundDomainFilter implements ExceptionFilter {
  catch(exception: { code: string }, host: ArgumentsHost) {
    host.switchToHttp().getResponse<Response>().status(404).json({
      message: 'Not found',
      code: exception.code,
    });
  }
}
