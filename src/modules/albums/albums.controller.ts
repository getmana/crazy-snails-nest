import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { AlbumsService } from './albums.service';
import {
  type CreateAlbumPayload,
  CreateAlbumSchema,
} from './dto/create-album.dto';
// import { UpdateAlbumDto } from './dto/update-album.dto';
import { AuthGuard } from '@nestjs/passport';
import { FILE_UPLOAD_URL } from 'src/constants';
import { ZodValidationPipe } from 'src/pipes';
import { FileUploadInterceptor } from 'src/interceptors';
import { CountryCodePipe } from 'src/pipes/country-code.pipe';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { type UserStrategyPayload } from '../auth/strategies';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  // save file to memory first
  // move all the checks (country codes, getting their IDs) to service
  // then upload the file and create the album
  // think of a save file layer for future when using cloud instead disk

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileUploadInterceptor)
  create(
    @Body(new ZodValidationPipe(CreateAlbumSchema))
    createAlbumDto: CreateAlbumPayload,
    @Body('countries', CountryCodePipe) countryIds: number[],
    @CurrentUser() user: UserStrategyPayload,
    @UploadedFile()
    previewImage: Express.Multer.File,
  ) {
    const previewImageUrl = `/${FILE_UPLOAD_URL}/${previewImage.filename}`;
    return this.albumsService.create({
      ...createAlbumDto,
      countryIds,
      previewImageUrl,
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
