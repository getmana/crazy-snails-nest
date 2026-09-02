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
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  createUserSchema,
  type CreateUserDto,
  type User,
  type UpdateUserDto,
  updateUserSchema,
} from './dto/users.dto';
import {
  UserExistPipe,
  DefaultUserFieldsPipe,
  UserActivePipe,
  ZodValidationPipe,
} from 'src/pipes';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { SelfOrAdminGuard } from 'src/guards';
import { zodToApiSchema } from 'src/utils';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  @UsePipes(
    new ZodValidationPipe(createUserSchema),
    UserExistPipe,
    DefaultUserFieldsPipe,
  )
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ schema: zodToApiSchema(createUserSchema) })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async signupUser(
    @Body()
    userData: CreateUserDto,
  ): Promise<User> {
    return this.userService.createUser(userData);
  }

  @Get()
  @ApiOperation({ summary: 'List all active users' })
  @ApiResponse({ status: 200, description: 'Array of active users' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single active user by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found or inactive' })
  findOne(@Param('id', UserActivePipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), SelfOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update username, email, locale or admin theme' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBody({ schema: zodToApiSchema(updateUserSchema) })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found or inactive' })
  update(
    @Param('id', UserActivePipe) id: number,
    @Body(new ZodValidationPipe(updateUserSchema), UserExistPipe)
    updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  // TODO
  // The case to test RolesGuard
  // Move to SelfOrAdminGuard to allow user delete his account after adding smth role specific
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a user (admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  @ApiResponse({ status: 404, description: 'User not found or inactive' })
  async deleteUser(
    @Param('id', UserActivePipe) id: number,
  ): Promise<{ id: number }> {
    return this.userService.deactivateUser(id);
  }
}
