import {
  PipeTransform,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ErrorCodes } from 'src/constants/error-codes';
import { CountryCodesNotFoundException } from 'src/exceptions/country-codes-not-found.exception';

import { CountriesService } from 'src/modules/countries/countries.service';

@Injectable()
export class CountryCodePipe implements PipeTransform {
  constructor(private countries: CountriesService) {}

  async transform(codes: string[]) {
    try {
      return await this.countries.findCountryByCode(codes);
    } catch (e: unknown) {
      if (e instanceof CountryCodesNotFoundException) {
        throw new BadRequestException({
          message: e.message,
          code: CountryCodesNotFoundException.code,
        });
      }

      console.error('CountryCodePipe error: ', e);

      throw new InternalServerErrorException({
        message: 'Internal Server Error',
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
