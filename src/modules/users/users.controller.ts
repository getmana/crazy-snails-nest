import {
  Controller,
  Post,
  Body,
  UsePipes,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  createUserSchema,
  type CreateUserDto,
  type User,
  type DeleteUserPayload,
  deleteUserSchema,
} from './users.dto';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import { UserExistPipe } from 'src/pipes/user-exist.pipe';
import { DefaultRolePipe } from 'src/pipes/default-role.pipe';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';

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

  @Delete()
  @UsePipes(new ZodValidationPipe(deleteUserSchema))
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async deleteUser(@Body() data: DeleteUserPayload): Promise<void> {
    await this.userService.deleteUser(data.id);
  }
}
