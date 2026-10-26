import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { TokenGenerationFailedException } from 'src/exceptions';

@Catch(TokenGenerationFailedException)
export class TokenGenerationFailedFilter implements ExceptionFilter {
  catch(
    { code, message }: { code: string; message: string },
    host: ArgumentsHost,
  ) {
    host.switchToHttp().getResponse<Response>().status(500).json({
      message,
      code,
    });
  }
}
