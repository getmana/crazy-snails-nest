import {
  PipeTransform,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ErrorCodes } from 'src/constants/error-codes';
import { PinoLogger, InjectPinoLogger } from 'pino-nestjs';
import { UsersService } from 'src/modules/users/users.service';
import { ActiveUserNotFoundException } from 'src/exceptions/active-user-not-found.exception';

@Injectable()
export class UserActivePipe implements PipeTransform {
  constructor(
    readonly userService: UsersService,
    @InjectPinoLogger(UserActivePipe.name) private logger: PinoLogger,
  ) {}

  async transform(value: string) {
    const id = +value;

    if (isNaN(id)) {
      throw new BadRequestException('id must be a number');
    }

    try {
      const user = await this.userService.findActiveUser(id);
      return user.id;
    } catch (e) {
      if (e instanceof ActiveUserNotFoundException) {
        throw new NotFoundException({
          message: e.message,
          code: ErrorCodes.USER_NOT_FOUND,
        });
      }

      this.logger.error(
        'UserActivePipe error',
        e instanceof Error ? e.stack : String(e),
        UserActivePipe.name,
      );

      throw new InternalServerErrorException({
        message: 'Internal Server Error',
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
