import { PipeTransform, Injectable } from '@nestjs/common';
import { CountriesService } from 'src/modules/countries/countries.service';

@Injectable()
export class CountryCodePipe implements PipeTransform {
  constructor(private countries: CountriesService) {}

  async transform(codes: string[]) {
    return await this.countries.findCountryByCode(codes);
  }
}
