import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { ActivityType, Prisma } from '@prisma/client';
import {
  AlbumNotFoundException,
  EntityNotPublished,
  PhotoNotOwnedException,
  PreviewPhotoInvalidException,
} from 'src/exceptions';
import { ErrorCodes } from 'src/constants';
import { buildPaginationArgs, findManyPaginated, toJsonInput } from 'src/utils';
import { UserStrategyPayload } from 'src/modules/auth/strategies';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { SharedUsersService } from 'src/modules/shared/users/shared-users.service';
import { type GetUserAlbumsDto } from 'src/dto';

const albumDetailIncludes = (albumId: number): Prisma.AlbumInclude => ({
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
            where: { album_id: albumId },
          },
        },
      },
    },
    orderBy: { position: 'asc' },
  },
  activities: true,
  photo: true,
});

const albumPreviewInclude = {
  photo: true,
} satisfies Prisma.AlbumInclude;

@Injectable()
export class AlbumsService {
  constructor(
    private prisma: PrismaService,
    private userService: SharedUsersService,
  ) {}

  async create(createAlbumDto: CreateAlbumDto) {
    const {
      title,
      titleEn,
      titleUk,
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

  async findManyByUser(getUserAlbumsDto: GetUserAlbumsDto) {
    await this.userService.assertActiveUser(getUserAlbumsDto.userId);
    return await this.findMany(getUserAlbumsDto);
  }

  async findMany({
    userId,
    publishedOnly,
    cursor,
    limit,
  }: {
    userId?: number;
    publishedOnly?: boolean;
    cursor?: number;
    limit: number;
  }) {
    return findManyPaginated(
      () =>
        this.prisma.album.findMany({
          where: {
            ...(userId !== undefined && { user_id: userId }),
            ...(publishedOnly !== undefined && { is_published: publishedOnly }),
            user: { is_active: true },
          },
          include: albumPreviewInclude,
          ...buildPaginationArgs(cursor, limit),
        }),
      limit,
    );
  }

  async findOne(id: number, requesterId: number | null) {
    const album = await this.prisma.album.findUnique({
      where: {
        id,
        user: { is_active: true },
      },
      include: albumDetailIncludes(id),
    });

    if (!album)
      throw new AlbumNotFoundException(`Album with id ${id} not found`);

    if (!album.is_published && album.user_id !== requesterId)
      throw new EntityNotPublished(
        `Album with id ${id} not found`,
        ErrorCodes.ALBUM_NOT_FOUND,
      );

    return album;
  }

  async update(updateAlbumDto: UpdateAlbumDto) {
    const {
      id,
      userId,
      title,
      titleEn,
      titleUk,
      subtitle,
      subtitleEn,
      subtitleUk,
      description,
      descriptionEn,
      descriptionUk,
      isPublished,
      countries,
      startDate,
      endDate,
      activityTypes,
      previewImageId,
      albumPhotoIds,
    } = updateAlbumDto;

    const album = await this.prisma.$transaction(async (tx) => {
      if (albumPhotoIds !== undefined) {
        const owned = await tx.photo.count({
          where: { id: { in: albumPhotoIds }, user_id: userId },
        });

        if (owned !== new Set(albumPhotoIds).size)
          throw new PhotoNotOwnedException(
            "Some photos don't belong to the user",
          );
      }

      if (previewImageId !== undefined && albumPhotoIds === undefined) {
        const valid = await tx.photoAlbum.count({
          where: {
            photo_id: previewImageId,
            album_id: id,
            photo: { user_id: userId },
          },
        });

        if (!valid)
          throw new PreviewPhotoInvalidException('Preview photo invalid');
      }

      if (albumPhotoIds !== undefined) {
        await tx.note.deleteMany({
          where: {
            album_id: id,
            photo_id: { notIn: albumPhotoIds },
          },
        });
      }

      let updated = await tx.album.update({
        where: { id, user_id: userId },
        data: {
          title,
          title_en: titleEn,
          title_uk: titleUk,
          description: toJsonInput(description),
          description_en: toJsonInput(descriptionEn),
          description_uk: toJsonInput(descriptionUk),
          subtitle,
          subtitle_en: subtitleEn,
          subtitle_uk: subtitleUk,
          is_published:
            albumPhotoIds !== undefined && albumPhotoIds.length === 0
              ? false
              : isPublished,
          start_date: startDate,
          end_date: endDate,
          preview_image_id: previewImageId,
          ...(countries !== undefined && {
            countries: {
              deleteMany: { album_id: id },
              create: countries.map((countryId, position) => ({
                position,
                country: {
                  connect: { id: countryId },
                },
              })),
            },
          }),
          ...(activityTypes !== undefined && {
            activities: {
              deleteMany: { album_id: id },
              create: activityTypes.map((activity_type) => ({
                activity_type,
              })),
            },
          }),
          ...(albumPhotoIds !== undefined && {
            photos: {
              deleteMany: { album_id: id },
              create: albumPhotoIds.map((photoId, position) => ({
                position,
                photo: {
                  connect: { id: photoId },
                },
              })),
            },
          }),
        },
        include: albumDetailIncludes(id),
      });

      const { preview_image_id } = updated;

      if (
        albumPhotoIds !== undefined &&
        preview_image_id &&
        !albumPhotoIds.includes(preview_image_id)
      ) {
        updated = await tx.album.update({
          where: { id, user_id: userId },
          data: {
            preview_image_id: albumPhotoIds.length ? albumPhotoIds[0] : null,
          },
          include: albumDetailIncludes(id),
        });
      }

      return updated;
    });

    return album;
  }

  async remove(id: number, user: UserStrategyPayload) {
    await this.prisma.album.delete({
      where: { id, ...(user.role !== 'admin' && { user_id: user.id }) },
    });
  }

  readActivityType() {
    return Object.values(ActivityType);
  }
}
