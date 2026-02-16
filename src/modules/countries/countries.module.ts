import { Module } from '@nestjs/common';
import { CountriesService } from './countries.service';

@Module({
  controllers: [],
  providers: [CountriesService],
})
export class CountriesModule {}
