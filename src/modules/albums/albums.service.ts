import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
// import { UpdateAlbumDto } from './dto/update-album.dto';

@Injectable()
export class AlbumsService {
  constructor(private prisma: PrismaService) {}

  async create(createAlbumDto: CreateAlbumDto) {
    const {
      titleEn,
      titleUk,
      descriptionEn,
      descriptionUk,
      countries,
      startDate,
      endDate,
      previewImageUrl,
    } = createAlbumDto;
    // TODO Create countries model to get ID from country_album table

    const album = await this.prisma.album.create({
      data: {
        titleEn,
        titleUk,
        descriptionEn,
        descriptionUk,
        countries,
        startDate,
        endDate,
        previewImageUrl,
      },
    });
    console.log('createAlbumDto', createAlbumDto);
    return { message: 'This action adds a new album' };
  }

  findAll() {
    return `This action returns all albums`;
  }

  findOne(id: number) {
    return `This action returns a #${id} album`;
  }

  // update(id: number, updateAlbumDto: UpdateAlbumDto) {
  //   return `This action updates a #${id} album`;
  // }

  remove(id: number) {
    return `This action removes a #${id} album`;
  }
}
