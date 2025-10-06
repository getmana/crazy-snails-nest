import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { UserStrategyPayload } from 'src/modules/auth/jwt.strategy';

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
      throw new ForbiddenException('Insufficient role permissions');
    }

    return true;
  }
}
