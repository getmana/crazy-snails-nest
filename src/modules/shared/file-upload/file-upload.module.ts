import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import { multerConfig, fileFilter } from './multer.config';

@Module({
  imports: [
    MulterModule.register({
      storage: multerConfig.storage,
      fileFilter,
    }),
  ],
  providers: [FileUploadService],
  exports: [FileUploadService, MulterModule],
})
export class FileUploadModule {}
