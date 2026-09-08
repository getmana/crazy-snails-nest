import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AlbumsService } from './albums.service';
import {
  type CreateAlbumPayload,
  CreateAlbumSchema,
} from './dto/create-album.dto';
import { AuthGuard } from '@nestjs/passport';
import { ZodValidationPipe } from 'src/pipes';
import {
  ApiPaginatedResponse,
  CurrentUser,
  ApiPaginationQuery,
} from 'src/decorators';
import { type UserStrategyPayload } from '../auth/strategies';
import { zodToApiSchema } from 'src/utils';
import { OptionalJwtGuard } from 'src/guards';
import { type PaginationPayload, PaginationSchema } from 'src/dto';

@ApiTags('albums')
@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new album',
    description:
      'At least one of titleEn / titleUk is required. At least one of descriptionEn / descriptionUk is required.',
  })
  @ApiBody({ schema: zodToApiSchema(CreateAlbumSchema) })
  @ApiResponse({ status: 201, description: 'Album created, returns album id' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body(new ZodValidationPipe(CreateAlbumSchema))
    createAlbumDto: CreateAlbumPayload,
    @CurrentUser() user: UserStrategyPayload,
  ) {
    return this.albumsService.create({
      ...createAlbumDto,
      userId: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all published albums' })
  @ApiPaginationQuery()
  @ApiPaginatedResponse('Paginated albums')
  async findAll(
    @Query(new ZodValidationPipe(PaginationSchema))
    paginationDto: PaginationPayload,
  ) {
    return await this.albumsService.findMany({
      publishedOnly: true,
      ...paginationDto,
    });
  }

  @Get('/mine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all owned albums' })
  @ApiPaginationQuery()
  @ApiPaginatedResponse('Paginated own albums')
  async findOwnAlbums(
    @Query(new ZodValidationPipe(PaginationSchema))
    paginationDto: PaginationPayload,
    @CurrentUser() user: UserStrategyPayload,
  ) {
    return await this.albumsService.findMany({
      userId: user.id,
      ...paginationDto,
    });
  }

  @Get('/activity-types')
  @ApiOperation({ summary: 'List all available activity types' })
  @ApiResponse({ status: 200, description: 'Array of activity type strings' })
  read() {
    return this.albumsService.readActivityType();
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a single album by ID',
    description:
      'Auth is optional. Unauthenticated requests return only published albums. Authenticated owners also see their own unpublished drafts.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Album found' })
  @ApiResponse({ status: 404, description: 'Album not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserStrategyPayload | null,
  ) {
    return await this.albumsService.findOne(id, user?.id ?? null);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an album by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Album deleted' })
  @ApiResponse({ status: 404, description: 'Album not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.albumsService.remove(id);
  }
}
