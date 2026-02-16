import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CountriesService {
  constructor(private prisma: PrismaService) {}

  async findCountryByCode(codes: string[]): Promise<number[]> {
    const countries = await this.prisma.country.findMany({
      where: {
        code: { in: codes },
      },
      select: {
        id: true,
        code: true,
      },
    });

    // TODO throw domain error and in a pipe (HTTP layer) translate it to BadRequestException
    if (countries.length !== codes.length) {
      const found = new Set(countries.map(({ code }) => code));
      const missing = codes.filter((code) => !found.has(code));

      throw new BadRequestException(
        `Unknown country codes: ${missing.join(', ')}`,
      );
    }

    const map = new Map(countries.map(({ code, id }) => [code, id]));
    return codes.map((code) => map.get(code)!);
  }
}
