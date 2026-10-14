import { Module } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';
import { NotesService } from './notes.service';
import { SharedModule } from '../shared/users/shared.module';
import { UserAlbumsController } from './user-albums.controller';

@Module({
  controllers: [AlbumsController, UserAlbumsController],
  providers: [AlbumsService, NotesService],
  imports: [SharedModule],
  exports: [AlbumsService],
})
export class AlbumsModule {}
