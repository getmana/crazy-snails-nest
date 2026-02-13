import { PrismaClient } from '@prisma/client';
import { seedCountries } from './seeds/countries.seed';

const prisma = new PrismaClient();

async function main() {
  await seedCountries(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
