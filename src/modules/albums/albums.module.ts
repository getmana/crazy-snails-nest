import { Module } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';
import { CountriesModule } from '../countries/countries.module';

@Module({
  controllers: [AlbumsController],
  providers: [AlbumsService],
  imports: [CountriesModule],
})
export class AlbumsModule {}
