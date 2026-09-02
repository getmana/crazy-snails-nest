import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserStrategyPayload } from 'src/modules/auth/strategies';
import { Request } from 'express';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest<TUser = UserStrategyPayload>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err) throw err;

    if (user) return user as TUser;

    const request = context.switchToHttp().getRequest<Request>();
    if (request.headers.authorization) {
      throw new UnauthorizedException(
        info instanceof Error ? info.message : 'Invalid token',
      );
    }

    return null as TUser;
  }
}
