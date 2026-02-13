import { Injectable } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  multerConfig,
  fileFilter,
} from 'src/modules/shared/file-upload/multer.config';
import { MAX_IMAGE_SIZE } from 'src/constants';

@Injectable()
export class FileUploadInterceptor extends FileInterceptor('previewImage', {
  storage: multerConfig.storage,
  fileFilter: fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}) {}
