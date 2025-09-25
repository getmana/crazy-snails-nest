import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { UsersService } from './users.service';
import { createUserSchema, type CreateUserDto, type User } from './users.dto';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import { UserExistPipe } from 'src/pipes/user-exist.pipe';
import { DefaultRolePipe } from 'src/pipes/default-role.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  @UsePipes(
    new ZodValidationPipe(createUserSchema),
    UserExistPipe,
    DefaultRolePipe,
  )
  async signupUser(
    @Body()
    userData: CreateUserDto,
  ): Promise<User> {
    return this.userService.createUser(userData);
  }
}
