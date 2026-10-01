import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ZodValidationPipe } from 'src/pipes';
import { ApiPaginatedResponse, ApiPaginationQuery } from 'src/decorators';
import { type PaginationPayload, PaginationSchema } from 'src/dto';
import { StoriesService } from './stories.service';

@ApiTags('user-stories')
@Controller('users')
export class UserStoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get(':id/stories')
  @ApiOperation({ summary: 'Get published stories of a single user' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiPaginationQuery()
  @ApiPaginatedResponse('User stories')
  async findUserStories(
    @Query(new ZodValidationPipe(PaginationSchema))
    paginationDto: PaginationPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.storiesService.findManyByUser({
      publishedOnly: true,
      userId: id,
      ...paginationDto,
    });
  }
}
