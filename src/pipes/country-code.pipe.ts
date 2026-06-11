import {
  PipeTransform,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ErrorCodes } from 'src/constants/error-codes';
import { CountryCodesNotFoundException } from 'src/exceptions/country-codes-not-found.exception';
import { PinoLogger, InjectPinoLogger } from 'pino-nestjs';
import { CountriesService } from 'src/modules/countries/countries.service';

@Injectable()
export class CountryCodePipe implements PipeTransform {
  constructor(
    private countries: CountriesService,
    @InjectPinoLogger(CountryCodePipe.name)
    private logger: PinoLogger,
  ) {}

  async transform(codes: { code: string }[]) {
    try {
      return await this.countries.findCountryByCode(
        codes.map(({ code }) => code),
      );
    } catch (e: unknown) {
      if (e instanceof CountryCodesNotFoundException) {
        throw new BadRequestException({
          message: e.message,
          code: CountryCodesNotFoundException.code,
        });
      }

      this.logger.error(
        'CountryCodePipe error',
        e instanceof Error ? e.stack : String(e),
        CountryCodePipe.name,
      );

      throw new InternalServerErrorException({
        message: 'Internal Server Error',
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
