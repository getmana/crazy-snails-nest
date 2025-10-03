import {
  Controller,
  Post,
  Body,
  UsePipes,
  Delete,
  UseGuards,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  createUserSchema,
  type CreateUserDto,
  type User,
  type UpdateUserDto,
  updateUserSchema,
} from './users.dto';
import {
  UserExistPipe,
  DefaultUserFieldsPipe,
  UserActivePipe,
  ZodValidationPipe,
} from 'src/pipes';
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
    DefaultUserFieldsPipe,
  )
  async signupUser(
    @Body()
    userData: CreateUserDto,
  ): Promise<User> {
    return this.userService.createUser(userData);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', UserActivePipe) id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  update(
    @Param('id', UserActivePipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(+id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async deleteUser(
    @Param('id', UserActivePipe) id: string,
  ): Promise<{ id: number }> {
    return this.userService.deactivateUser(+id);
  }
}
