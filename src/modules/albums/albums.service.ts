import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { ActivityType } from '@prisma/client';
import { AlbumNotFoundException } from 'src/exceptions/album-not-found.exception';
import { EntityNotPublished } from 'src/exceptions/entity-not-published.exception';
import { ErrorCodes } from 'src/constants/error-codes';

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
      countries,
      startDate,
      endDate,
      userId,
      activityTypes,
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
        user_id: userId,
        countries: {
          create: countries.map((id, position) => ({
            position,
            country: {
              connect: { id },
            },
          })),
        },
        activities: {
          create: activityTypes.map((activity_type) => ({
            activity_type,
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

    return { id: album.id };
  }

  findAll() {
    return `This action returns all albums`;
  }

  async findOne(id: number, requesterId: number | null) {
    const album = await this.prisma.album.findUnique({
      where: {
        id,
      },
      include: {
        countries: {
          include: {
            country: true,
          },
          orderBy: { position: 'asc' },
        },
        photos: {
          include: {
            photo: {
              include: {
                notes: {
                  where: { album_id: id },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        activities: true,
      },
    });

    if (!album)
      throw new AlbumNotFoundException(`Album with id ${id} not found`);

    if (!album.is_published && album.user_id !== requesterId)
      throw new EntityNotPublished(
        `Album with id ${id} not published`,
        ErrorCodes.ALBUM_NOT_FOUND,
      );

    return album;
  }

  remove(id: number) {
    return `This action removes a #${id} album`;
  }

  readActivityType() {
    return Object.values(ActivityType);
  }
}
