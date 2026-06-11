import { Injectable } from '@nestjs/common';
import { StorageService } from '../shared/storage/storage.service';

@Injectable()
export class FilesService {
  constructor(private readonly storageService: StorageService) {}

  create(file: Express.Multer.File) {
    return this.storageService.saveFile(file);
  }

  delete() {}
}
