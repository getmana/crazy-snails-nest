import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CountryCodesNotFoundException } from 'src/exceptions/country-codes-not-found.exception';

@Injectable()
export class CountriesService {
  constructor(private prisma: PrismaService) {}

  async findCountryByCode(codes: string[]): Promise<number[]> {
    console.log('COUNTRIES CERVICE codes==>', codes);
    const countries = await this.prisma.country.findMany({
      where: {
        code: { in: codes },
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (countries.length !== codes.length) {
      const found = new Set(countries.map(({ code }) => code));
      const missing = codes.filter((code) => !found.has(code));

      throw new CountryCodesNotFoundException(
        `Unknown country codes: ${missing.join(', ')}`,
      );
    }

    const map = new Map(countries.map(({ code, id }) => [code, id]));
    return codes.map((code) => map.get(code)!);
  }
}
