import { Controller, Post, UseGuards, Body } from '@nestjs/common';
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
} from '@nestjs/swagger';
import { zodToApiSchema } from 'src/utils';

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
  @ApiResponse({ status: 201, description: 'Story created, returns story' })
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
}
