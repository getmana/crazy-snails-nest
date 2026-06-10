import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCodes } from 'src/constants/error-codes';
import { ROLES_KEY } from 'src/decorators/roles.decorator';
import { UserStrategyPayload } from 'src/modules/auth/strategies';

interface RequestWithUser extends Request {
  user: UserStrategyPayload;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.some((role) => user.role === role)) {
      throw new ForbiddenException({
        message: 'Insufficient role permissions',
        code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
      });
    }

    return true;
  }
}
