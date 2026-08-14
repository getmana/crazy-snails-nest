import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { ErrorCodes } from 'src/constants/error-codes';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === 'P2025') {
      return response.status(404).json({
        statusCode: 404,
        message: 'Record not found',
        code: ErrorCodes.RECORD_NOT_FOUND,
      });
    }

    if (exception.code === 'P2002') {
      return response.status(409).json({
        statusCode: 409,
        message: 'Unique constraint violation',
        code: ErrorCodes.UNIQUE_CONSTRAINT_VIOLATION,
      });
    }

    this.logger.error(
      `Unhandled Prisma error [${exception.code}]: ${exception.message}`,
      exception.stack,
    );

    return response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
    });
  }
}
