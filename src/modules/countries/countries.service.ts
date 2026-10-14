import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CountryCodesNotFoundException } from 'src/exceptions/country-codes-not-found.exception';

@Injectable()
export class CountriesService {
  constructor(private prisma: PrismaService) {}

  async findIdsByCodes(codes: string[]): Promise<number[]> {
    const uniqueCodes = [...new Set(codes)];
    const countries = await this.prisma.country.findMany({
      where: {
        code: { in: uniqueCodes },
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (countries.length !== uniqueCodes.length) {
      const found = new Set(countries.map(({ code }) => code));
      const missing = uniqueCodes.filter((code) => !found.has(code));

      throw new CountryCodesNotFoundException(
        `Unknown country codes: ${missing.join(', ')}`,
      );
    }

    const map = new Map(countries.map(({ code, id }) => [code, id]));
    return codes.map((code) => map.get(code)!);
  }

  async findAll() {
    const countries = await this.prisma.country.findMany({
      select: {
        id: true,
        name_en: true,
        name_uk: true,
      },
    });

    return countries;
  }
}
