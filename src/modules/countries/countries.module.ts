import { Module } from '@nestjs/common';
import { CountriesService } from './countries.service';

@Module({
  controllers: [],
  providers: [CountriesService],
  exports: [CountriesService],
})
export class CountriesModule {}
