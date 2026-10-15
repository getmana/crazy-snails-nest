import { Injectable } from '@nestjs/common';
import { extname, join } from 'path';
import { FILE_UPLOAD_URL } from 'src/constants';
import { promises as fs } from 'fs';
import { FileWriteException } from 'src/exceptions/file-write.exception';
import { PinoLogger, InjectPinoLogger } from 'pino-nestjs';

@Injectable()
export class StorageService {
  constructor(
    @InjectPinoLogger(StorageService.name)
    private logger: PinoLogger,
  ) {}

  async saveFile(file: Express.Multer.File) {
    const fileExt = extname(file.originalname).toLowerCase();
    const uniqueSuffix = crypto.randomUUID();

    const fileName = `${uniqueSuffix}${fileExt}`;
    const folderName = new Date().toISOString().split('T')[0];

    const pathName = join(process.cwd(), FILE_UPLOAD_URL, folderName);
    const path = join(pathName, fileName);
    try {
      await fs.mkdir(pathName, {
        recursive: true,
      });
      await fs.writeFile(path, file.buffer);
      return join(folderName, fileName);
    } catch (e: unknown) {
      this.logger.error(
        'StorageService saveFile error',
        e instanceof Error ? e.stack : String(e),
        StorageService.name,
      );
      throw new FileWriteException(`Error writing file: ${file.originalname}`);
    }
  }

  async deleteFile(key: string) {
    try {
      await fs.rm(this.getFilePath(key), { force: true });
    } catch (e: unknown) {
      this.logger.error(
        'StorageService deleteFile error',
        e instanceof Error ? e.stack : String(e),
        StorageService.name,
      );
      throw e;
    }
  }

  getFilePath(filename: string): string {
    return join(process.cwd(), FILE_UPLOAD_URL, filename);
  }

  getPublicFilePath(filename: string): string {
    return `/${FILE_UPLOAD_URL}/${filename}`;
  }
}
