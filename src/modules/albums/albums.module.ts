import { Module } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';
import { CountriesModule } from '../countries/countries.module';
import { NotesService } from './notes.service';

@Module({
  controllers: [AlbumsController],
  providers: [AlbumsService, NotesService],
  imports: [CountriesModule],
  exports: [AlbumsService],
})
export class AlbumsModule {}
