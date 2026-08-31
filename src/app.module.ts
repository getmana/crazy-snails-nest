import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AlbumsModule } from './modules/albums/albums.module';
import { StorageModule } from './modules/shared/storage/storage.module';
import { LoggerModule } from 'pino-nestjs';
import { PhotosModule } from './modules/photos/photos.module';
import { CountriesModule } from './modules/countries/countries.module';
import { StoriesModule } from './modules/stories/stories.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CountriesModule,
    UsersModule,
    PrismaModule,
    AuthModule,
    AlbumsModule,
    StorageModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    PhotosModule,
    StoriesModule,
  ],
})
export class AppModule {}
