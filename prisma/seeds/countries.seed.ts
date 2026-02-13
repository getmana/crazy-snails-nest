import { PrismaClient } from '@prisma/client';
import countries from 'i18n-iso-countries';

import en from 'i18n-iso-countries/langs/en.json';
import uk from 'i18n-iso-countries/langs/uk.json';

countries.registerLocale(en);
countries.registerLocale(uk);

export async function seedCountries(prisma: PrismaClient) {
  console.log('Seeding countries...');

  const codes = countries.getAlpha2Codes();

  const data = Object.keys(codes).map((code) => ({
    code,
    name_en: countries.getName(code, 'en') ?? code,
    name_uk: countries.getName(code, 'uk') ?? code,
  }));

  for (const country of data) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {
        name_en: country.name_en,
        name_uk: country.name_uk,
      },
      create: country,
    });
  }

  console.log(`Seeded ${data.length} countries`);
}
