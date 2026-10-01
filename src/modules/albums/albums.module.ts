import { Module } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';
import { CountriesModule } from '../countries/countries.module';
import { NotesService } from './notes.service';
import { SharedModule } from '../shared/users/shared.module';

@Module({
  controllers: [AlbumsController],
  providers: [AlbumsService, NotesService],
  imports: [CountriesModule, SharedModule],
  exports: [AlbumsService],
})
export class AlbumsModule {}
