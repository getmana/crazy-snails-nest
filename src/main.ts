import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodFilter } from './filters/zod-error.filter';
import { FileWriteFilter } from './filters/file-write-error.filter';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { FILE_UPLOAD_URL } from './constants';
import { Logger } from 'pino-nestjs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useLogger(app.get(Logger));

  app.useStaticAssets(join(__dirname, '..', FILE_UPLOAD_URL), {
    prefix: `/${FILE_UPLOAD_URL}/`,
  });

  app.useGlobalFilters(new ZodFilter(), new FileWriteFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
