import { Injectable } from '@nestjs/common';
import { StorageService } from 'src/modules/shared/storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Injectable()
export class PhotosService {
  constructor(
    private readonly storageService: StorageService,
    private prisma: PrismaService,
  ) {}

  async create({
    file,
    userId,
  }: {
    file: Express.Multer.File;
    userId: number;
  }): Promise<CreatePhotoDto> {
    const originalKey = await this.storageService.saveFile(file);
    const photo = await this.prisma.photo.create({
      data: {
        original_key: originalKey,
        status: 'pending',
        user_id: userId,
      },
    });
    return {
      photoId: photo.id,
      originalUrl: this.storageService.getPublicFilePath(originalKey),
      status: 'pending',
      thumbnailSmUrl: null,
      thumbnailMdUrl: null,
    };
  }

  delete() {}
}
