import { createHash, timingSafeEqual } from 'crypto';
import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import type { Request } from 'express';
import { DEFAULT_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from 'src/constants';

export const FRONTEND_SECRET_ENV = 'FRONTEND_API_SECRET';
export const FRONTEND_SECRET_HEADER = 'x-frontend-secret';

const sha256 = (value: string) => createHash('sha256').update(value).digest();

export const isTrustedFrontend = (
  headerValue: unknown,
  secret: string | undefined,
): boolean => {
  if (!secret || typeof headerValue !== 'string') return false;
  return timingSafeEqual(sha256(headerValue), sha256(secret));
};

export const createThrottlerOptions = (config: ConfigService) => {
  const secret = config.get<string>(FRONTEND_SECRET_ENV);

  return {
    throttlers: [{ ttl: RATE_LIMIT_WINDOW_MS, limit: DEFAULT_RATE_LIMIT }],
    errorMessage: 'Too many requests, please try again later',
    skipIf: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest<Request>();
      return isTrustedFrontend(request.headers[FRONTEND_SECRET_HEADER], secret);
    },
  } satisfies ThrottlerModuleOptions;
};
