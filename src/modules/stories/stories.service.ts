import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { EntityNotPublished } from 'src/exceptions/entity-not-published.exception';
import { StoryNotFoundException } from 'src/exceptions/story-not-found.exception';
import { ErrorCodes } from 'src/constants/error-codes';

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
      include: {
        carousel_stories: {
          include: {
            photo: true,
          },
          orderBy: { position: 'asc' },
        },
        pair_image_stories: {
          include: {
            photo: true,
          },
          orderBy: { position: 'asc' },
        },
        gallery_image_stories: {
          include: {
            photo: true,
          },
          orderBy: { position: 'asc' },
        },
      },
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
}
