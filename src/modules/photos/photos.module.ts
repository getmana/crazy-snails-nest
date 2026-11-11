import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { StorageModule } from 'src/modules/shared/storage/storage.module';

@Module({
  controllers: [PhotosController],
  providers: [PhotosService],
  imports: [StorageModule],
})
export class PhotosModule {}
