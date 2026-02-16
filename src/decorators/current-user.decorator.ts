import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { type UserStrategyPayload } from 'src/modules/auth/strategies';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: keyof UserStrategyPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return data ? request.user?.[data] : request.user;
  },
);
