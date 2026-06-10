import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { UserStrategyPayload } from 'src/modules/auth/strategies';
import { ErrorCodes } from 'src/constants/error-codes';

interface RequestWithUser extends Request {
  user: UserStrategyPayload;
}

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { user, params }: RequestWithUser & { params: { id: string } } =
      context.switchToHttp().getRequest();

    const { id, role } = user;
    const { id: paramsId } = params;

    if (!(role === Role.admin || id === +paramsId)) {
      throw new ForbiddenException({
        message: 'Insufficient role permissions',
        code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
      });
    }

    return true;
  }
}
