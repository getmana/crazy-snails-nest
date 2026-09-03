import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { EntityNotPublished } from 'src/exceptions/entity-not-published.exception';
import { StoryNotFoundException } from 'src/exceptions/story-not-found.exception';
import { ErrorCodes } from 'src/constants/error-codes';
import { UpdateStoryDto } from './dto/update-story.dto';
import { PhotoNotOwnedException } from 'src/exceptions/photo-not-owned.exception';
import { Prisma } from '@prisma/client';

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
} satisfies Prisma.StoryInclude;

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

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
      },
      include: storyPhotoIncludes,
    });

    if (!story)
      throw new StoryNotFoundException(`Story with id ${id} not found`);

    if (!story.is_published && story.user_id !== requesterId)
      throw new EntityNotPublished(
        `Story with id ${id} not published`,
        ErrorCodes.STORY_NOT_FOUND,
      );

    return story;
  }

  async update(updateStoryDto: UpdateStoryDto) {
    const {
      id,
      userId,
      title,
      titleEn,
      titleUk,
      description,
      descriptionEn,
      descriptionUk,
      heroFirst,
      heroImageId,
      pairPhotoIds,
      galleryPhotoIds,
      carouselPhotoIds,
      isPublished,
    } = updateStoryDto;

    const photoIds = [
      ...(heroImageId !== null && heroImageId !== undefined
        ? [heroImageId]
        : []),
      ...(Array.isArray(pairPhotoIds) ? pairPhotoIds : []),
      ...(Array.isArray(galleryPhotoIds) ? galleryPhotoIds : []),
      ...(Array.isArray(carouselPhotoIds) ? carouselPhotoIds : []),
    ];

    const owned = await this.prisma.photo.count({
      where: { id: { in: photoIds }, user_id: userId },
    });

    if (owned !== photoIds.length)
      throw new PhotoNotOwnedException("Some photos don't belong to the user");

    const story = await this.prisma.story.update({
      where: { id, user_id: userId },
      data: {
        title,
        title_en: titleEn,
        title_uk: titleUk,
        description,
        description_en: descriptionEn,
        description_uk: descriptionUk,
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
        ...(carouselPhotoIds !== undefined && {
          carousel_stories: {
            deleteMany: { story_id: id },
            create: carouselPhotoIds.map((photoId, position) => ({
              position,
              photo: {
                connect: { id: photoId },
              },
            })),
          },
        }),
      },
      include: storyPhotoIncludes,
    });

    return story;
  }
}
