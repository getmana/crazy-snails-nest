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
} from '@nestjs/common';
import { AlbumsService } from './albums.service';
import {
  type CreateAlbumPayload,
  CreateAlbumSchema,
} from './dto/create-album.dto';
// import { UpdateAlbumDto } from './dto/update-album.dto';
import { FILE_UPLOAD_URL } from 'src/constants';
import { ZodValidationPipe } from 'src/pipes';
import { FileUploadInterceptor } from 'src/interceptors';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  // think of validate countries first => then upload
  // check if errors are handled on uploading file
  @Post()
  @UseInterceptors(FileUploadInterceptor)
  create(
    @Body(new ZodValidationPipe(CreateAlbumSchema))
    createAlbumDto: CreateAlbumPayload,
    @UploadedFile()
    previewImage: Express.Multer.File,
  ) {
    const previewImageUrl = `/${FILE_UPLOAD_URL}/${previewImage.filename}`;
    return this.albumsService.create({ ...createAlbumDto, previewImageUrl });
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
