import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto } from './dto/create-story.dto';

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
        title: true,
        title_en: true,
        title_uk: true,
      },
    });

    return {
      id: story.id,
      title: story.title,
      titleEn: story.title_en,
      titleUk: story.title_uk,
    };
  }
}
