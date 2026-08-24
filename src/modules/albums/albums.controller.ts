import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
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
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { type UserStrategyPayload } from '../auth/strategies';
import { zodToApiSchema } from 'src/utils';

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
  @ApiOperation({ summary: 'List all albums' })
  @ApiResponse({ status: 200, description: 'Array of albums' })
  findAll() {
    return this.albumsService.findAll();
  }

  @Get('/activity-types')
  @ApiOperation({ summary: 'List all available activity types' })
  @ApiResponse({ status: 200, description: 'Array of activity type strings' })
  read() {
    return this.albumsService.readActivityType();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single album by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Album found' })
  @ApiResponse({ status: 404, description: 'Album not found' })
  findOne(@Param('id') id: string) {
    return this.albumsService.findOne(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an album by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Album deleted' })
  @ApiResponse({ status: 404, description: 'Album not found' })
  remove(@Param('id') id: string) {
    return this.albumsService.remove(+id);
  }
}
