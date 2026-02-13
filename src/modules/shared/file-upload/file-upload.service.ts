import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { FILE_UPLOAD_URL } from 'src/constants';

@Injectable()
export class FileUploadService {
  getFilePath(filename: string): string {
    return join(process.cwd(), FILE_UPLOAD_URL, filename);
  }

  getPublicFilePath(filename: string): string {
    return `/${FILE_UPLOAD_URL}/${filename}`;
  }
}
