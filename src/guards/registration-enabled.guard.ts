import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes } from 'src/constants';

const REGISTRATION_FLAG = 'REGISTRATION_ENABLED';
const ENABLED_VALUE = 'true';

@Injectable()
export class RegistrationEnabledGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(): boolean {
    if (this.config.get<string>(REGISTRATION_FLAG) !== ENABLED_VALUE) {
      throw new ForbiddenException({
        message: 'Registration is currently closed',
        code: ErrorCodes.REGISTRATION_CLOSED,
      });
    }

    return true;
  }
}
