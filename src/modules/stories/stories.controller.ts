import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  CreateStorySchema,
  type CreateStoryPayload,
} from './dto/create-story.dto';
import { ZodValidationPipe } from 'src/pipes';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { type UserStrategyPayload } from '../auth/strategies';
import { StoriesService } from './stories.service';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { zodToApiSchema } from 'src/utils';
import { OptionalJwtGuard } from 'src/guards';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new story',
    description: 'At least one of titleEn / titleUk is required.',
  })
  @ApiBody({ schema: zodToApiSchema(CreateStorySchema) })
  @ApiResponse({ status: 201, description: 'Story created, returns story ID' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body(new ZodValidationPipe(CreateStorySchema))
    createStoryDto: CreateStoryPayload,
    @CurrentUser() user: UserStrategyPayload,
  ) {
    return this.storiesService.create({
      ...createStoryDto,
      userId: user.id,
    });
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a single story by ID',
    description:
      'Auth is optional. Unauthenticated requests return only published stories. Authenticated owners also see their own unpublished drafts.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Story found' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserStrategyPayload | null,
  ) {
    return await this.storiesService.findOne(id, user?.id ?? null);
  }
}
