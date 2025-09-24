import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { UsersService } from './users.service';
import { User as UserModel } from '@prisma/client';
import { createUserSchema, type CreateUserDto } from './users.dto';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import { UniqueEmailPipe } from 'src/pipes/unique-email.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createUserSchema), UniqueEmailPipe)
  async signupUser(
    @Body()
    userData: CreateUserDto,
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }
}
