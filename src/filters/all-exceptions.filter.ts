import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ErrorCodes } from 'src/constants';
import { toErrorResponse } from './error-response';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const body = toErrorResponse(exception);

    if (body.code === ErrorCodes.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    if (body.code === ErrorCodes.HTTP_ERROR) {
      this.logger.warn(
        `Unlisted HTTP status ${body.statusCode} sent as ${ErrorCodes.HTTP_ERROR}: ${
          exception instanceof Error ? exception.message : String(exception)
        }`,
      );
    }

    host
      .switchToHttp()
      .getResponse<Response>()
      .status(body.statusCode)
      .json(body);
  }
}
