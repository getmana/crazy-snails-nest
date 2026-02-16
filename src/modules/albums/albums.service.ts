import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
// import { UpdateAlbumDto } from './dto/update-album.dto';

@Injectable()
export class AlbumsService {
  constructor(private prisma: PrismaService) {}

  async create(createAlbumDto: CreateAlbumDto) {
    const {
      title,
      titleEn,
      titleUk,
      description,
      descriptionEn,
      descriptionUk,
      countryIds,
      startDate,
      endDate,
      previewImageUrl,
      userId,
    } = createAlbumDto;

    const album = await this.prisma.album.create({
      data: {
        title,
        title_en: titleEn,
        title_uk: titleUk,
        description,
        description_en: descriptionEn,
        description_uk: descriptionUk,
        start_date: startDate,
        end_date: endDate,
        preview_image_url: previewImageUrl,
        user_id: userId,
        countries: {
          create: countryIds.map((id, position) => ({
            position,
            country: {
              connect: { id },
            },
          })),
        },
      },
      include: {
        countries: {
          include: { country: true },
          orderBy: { position: 'asc' },
        },
      },
    });
    console.log('albumId', album.id);
    return { id: album.id };
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
