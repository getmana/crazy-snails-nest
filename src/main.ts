import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodFilter } from './filters/zod-error.filter';
import { FileWriteFilter } from './filters/file-write-error.filter';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { FILE_UPLOAD_URL } from './constants';
import { Logger } from 'pino-nestjs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import {
  ForbiddenDomainFilter,
  NotFoundDomainFilter,
} from './filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useLogger(app.get(Logger));

  app.useStaticAssets(join(__dirname, '..', FILE_UPLOAD_URL), {
    prefix: `/${FILE_UPLOAD_URL}/`,
  });

  app.useGlobalFilters(
    new ZodFilter(),
    new FileWriteFilter(),
    new PrismaExceptionFilter(),
    new NotFoundDomainFilter(),
    new ForbiddenDomainFilter(),
  );

  const config = new DocumentBuilder()
    .setTitle('Basimtuklet API')
    .setDescription('REST API for the Basimtuklet traveller platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  app.use('/api-docs', apiReference({ spec: { content: document } }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
