import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { StorageModule } from '../shared/storage/storage.module';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  imports: [StorageModule],
})
export class FilesModule {}
