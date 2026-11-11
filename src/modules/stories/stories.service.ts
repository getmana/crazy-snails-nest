import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateStoryDto } from './dto/create-story.dto';
import {
  EntityNotPublished,
  StoryNotFoundException,
  PhotoNotOwnedException,
  StoryPhotoDuplicatedException,
} from 'src/exceptions';
import { ErrorCodes } from 'src/constants';
import { UpdateStoryDto } from './dto/update-story.dto';
import {
  type RequestedStoryPhotos,
  findDuplicatedIds,
  hasRequestedPhotos,
  listRequestedPhotoIds,
  resolveStoryPhotoIds,
  storedStoryPhotosSelect,
} from './utils';
import { Prisma } from '@prisma/client';
import { buildPaginationArgs, findManyPaginated, toJsonInput } from 'src/utils';
import { UserStrategyPayload } from 'src/modules/auth/strategies';
import { SharedUsersService } from 'src/modules/shared/users/shared-users.service';
import { type GetUserStoriesDto } from 'src/dto';

const storyPhotoIncludes = {
  carousel_stories: {
    include: { photo: true },
    orderBy: { position: 'asc' as const },
  },
  pair_image_stories: {
    include: { photo: true },
    orderBy: { position: 'asc' as const },
  },
  gallery_image_stories: {
    include: { photo: true },
    orderBy: { position: 'asc' as const },
  },
  photo: true,
} satisfies Prisma.StoryInclude;

const storyPreviewInclude = {
  photo: true,
} satisfies Prisma.StoryInclude;

@Injectable()
export class StoriesService {
  constructor(
    private prisma: PrismaService,
    private userService: SharedUsersService,
  ) {}

  async create(createStoryDto: CreateStoryDto) {
    const { title, titleEn, titleUk, userId } = createStoryDto;

    const story = await this.prisma.story.create({
      data: {
        title,
        title_en: titleEn,
        title_uk: titleUk,
        user_id: userId,
      },
      select: {
        id: true,
      },
    });

    return {
      id: story.id,
    };
  }

  async findOne(id: number, requesterId: number | null) {
    const story = await this.prisma.story.findUnique({
      where: {
        id,
        user: { is_active: true },
      },
      include: storyPhotoIncludes,
    });

    if (!story)
      throw new StoryNotFoundException(`Story with id ${id} not found`);

    if (!story.is_published && story.user_id !== requesterId)
      throw new EntityNotPublished(
        `Story with id ${id} not found`,
        ErrorCodes.STORY_NOT_FOUND,
      );

    return story;
  }

  async findManyByUser(getUserStoriesDto: GetUserStoriesDto) {
    await this.userService.assertActiveUser(getUserStoriesDto.userId);
    return await this.findMany(getUserStoriesDto);
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
        this.prisma.story.findMany({
          where: {
            ...(userId !== undefined && { user_id: userId }),
            ...(publishedOnly !== undefined && { is_published: publishedOnly }),
            user: { is_active: true },
          },
          include: storyPreviewInclude,
          ...buildPaginationArgs(cursor, limit),
        }),
      limit,
    );
  }

  async update(updateStoryDto: UpdateStoryDto) {
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
      heroFirst,
      heroImageId,
      pairPhotoIds,
      galleryPhotoIds,
      carouselPhotos,
      isPublished,
    } = updateStoryDto;

    const requestedPhotos: RequestedStoryPhotos = {
      heroImageId,
      pairPhotoIds,
      galleryPhotoIds,
      carouselPhotoIds: carouselPhotos?.map(({ photoId }) => photoId),
    };

    return this.prisma.$transaction(async (tx) => {
      await this.lockOwnedStory(tx, id, userId);

      if (hasRequestedPhotos(requestedPhotos)) {
        await this.assertPhotosOwned(tx, requestedPhotos, userId);
        await this.assertNoDuplicatedPhotos(tx, id, requestedPhotos);
      }

      return tx.story.update({
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
          hero_first: heroFirst,
          is_published: isPublished,
          hero_image_id: heroImageId,
          ...(pairPhotoIds !== undefined && {
            pair_image_stories: {
              deleteMany: { story_id: id },
              create: pairPhotoIds.map((photoId, position) => ({
                position,
                photo: {
                  connect: { id: photoId },
                },
              })),
            },
          }),
          ...(galleryPhotoIds !== undefined && {
            gallery_image_stories: {
              deleteMany: { story_id: id },
              create: galleryPhotoIds.map((photoId, position) => ({
                position,
                photo: {
                  connect: { id: photoId },
                },
              })),
            },
          }),
          ...(carouselPhotos !== undefined && {
            carousel_stories: {
              deleteMany: { story_id: id },
              create: carouselPhotos.map(
                ({ photoId, caption, captionEn, captionUk }, position) => ({
                  position,
                  photo: {
                    connect: { id: photoId },
                  },
                  caption,
                  caption_en: captionEn,
                  caption_uk: captionUk,
                }),
              ),
            },
          }),
        },
        include: storyPhotoIncludes,
      });
    });
  }

  private async lockOwnedStory(
    tx: Prisma.TransactionClient,
    id: number,
    userId: number,
  ) {
    const locked = await tx.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Story" WHERE id = ${id} AND user_id = ${userId} FOR UPDATE
    `;

    if (!locked.length)
      throw new StoryNotFoundException(`Story with id ${id} not found`);
  }

  private async assertPhotosOwned(
    tx: Prisma.TransactionClient,
    requested: RequestedStoryPhotos,
    userId: number,
  ) {
    const photoIds = [...new Set(listRequestedPhotoIds(requested))];
    if (!photoIds.length) return;

    const owned = await tx.photo.count({
      where: { id: { in: photoIds }, user_id: userId },
    });

    if (owned !== photoIds.length)
      throw new PhotoNotOwnedException("Some photos don't belong to the user");
  }

  private async assertNoDuplicatedPhotos(
    tx: Prisma.TransactionClient,
    id: number,
    requested: RequestedStoryPhotos,
  ) {
    const stored = await tx.story.findUniqueOrThrow({
      where: { id },
      select: storedStoryPhotosSelect,
    });

    const duplicated = findDuplicatedIds(
      resolveStoryPhotoIds(requested, stored),
    );

    if (duplicated.length)
      throw new StoryPhotoDuplicatedException(
        `Photos with IDs ${duplicated.join(', ')} are used in more than one story section`,
      );
  }

  async remove(id: number, user: UserStrategyPayload) {
    await this.prisma.story.delete({
      where: { id, ...(user.role !== 'admin' && { user_id: user.id }) },
    });
  }
}
