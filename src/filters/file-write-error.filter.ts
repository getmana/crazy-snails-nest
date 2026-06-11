import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { FileWriteException } from 'src/exceptions/file-write.exception';

@Catch(FileWriteException)
export class FileWriteFilter implements ExceptionFilter {
  catch(exception: FileWriteException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = 500;

    response.status(status).json({
      message: exception.message,
      statusCode: status,
      code: FileWriteException.code,
    });
  }
}
