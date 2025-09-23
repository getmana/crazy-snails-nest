import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { User as UserModel } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  async signupUser(
    @Body()
    userData: {
      password: string;
      email: string;
      username: string;
      role: 'editor' | 'admin';
    },
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }
}
