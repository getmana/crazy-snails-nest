import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AlbumsService } from './albums.service';
import { ZodValidationPipe } from 'src/pipes';
import { ApiPaginatedResponse, ApiPaginationQuery } from 'src/decorators';
import { type PaginationPayload, PaginationSchema } from 'src/dto';

@ApiTags('user-albums')
@Controller('users')
export class UserAlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get(':id/albums')
  @ApiOperation({ summary: 'Get published albums of a single user' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiPaginationQuery()
  @ApiPaginatedResponse('User albums')
  async findUserAlbums(
    @Query(new ZodValidationPipe(PaginationSchema))
    paginationDto: PaginationPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.albumsService.findManyByUser({
      publishedOnly: true,
      userId: id,
      ...paginationDto,
    });
  }
}
