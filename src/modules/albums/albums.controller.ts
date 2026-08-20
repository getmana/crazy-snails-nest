import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AlbumsService } from './albums.service';
import {
  type CreateAlbumPayload,
  CreateAlbumSchema,
} from './dto/create-album.dto';
import { AuthGuard } from '@nestjs/passport';
import { ZodValidationPipe } from 'src/pipes';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { type UserStrategyPayload } from '../auth/strategies';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
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
  findAll() {
    return this.albumsService.findAll();
  }

  @Get('/activity-types')
  read() {
    return this.albumsService.readActivityType();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.albumsService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.albumsService.remove(+id);
  }
}
