import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AlbumsService } from './albums.service';
import {
  type CreateAlbumPayload,
  CreateAlbumSchema,
} from './dto/create-album.dto';
// import { UpdateAlbumDto } from './dto/update-album.dto';
import { AuthGuard } from '@nestjs/passport';
import { ZodValidationPipe } from 'src/pipes';
import { CountryCodePipe } from 'src/pipes/country-code.pipe';
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
    @Body('countries', CountryCodePipe) countryIds: number[],
    @CurrentUser() user: UserStrategyPayload,
  ) {
    return this.albumsService.create({
      ...createAlbumDto,
      countryIds,
      userId: user.id,
    });
  }

  @Get()
  findAll() {
    return this.albumsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.albumsService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAlbumDto: UpdateAlbumDto) {
  //   return this.albumsService.update(+id, updateAlbumDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.albumsService.remove(+id);
  }
}
