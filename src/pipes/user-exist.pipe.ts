import {
  PipeTransform,
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ErrorCodes } from 'src/constants/error-codes';
import { PinoLogger, InjectPinoLogger } from 'pino-nestjs';
import { CreateUserDto } from 'src/modules/users/dto/users.dto';
import { UsersService } from 'src/modules/users/users.service';
import { UserAlreadyExistsException } from 'src/exceptions/user-already-exists.exception';

@Injectable()
export class UserExistPipe implements PipeTransform {
  constructor(
    readonly userService: UsersService,
    @InjectPinoLogger(UserExistPipe.name) private logger: PinoLogger,
  ) {}

  async transform(value: CreateUserDto) {
    const { email, username } = value;
    try {
      await this.userService.findExistingUser({ email, username });
      return value;
    } catch (e) {
      if (e instanceof UserAlreadyExistsException) {
        throw new ConflictException({
          message: e.message,
          code: ErrorCodes.USER_EXIST,
        });
      }

      this.logger.error(
        'UserExistPipe error',
        e instanceof Error ? e.stack : String(e),
        UserExistPipe.name,
      );

      throw new InternalServerErrorException({
        message: 'Internal Server Error',
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
