import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AlbumsModule } from '../albums/albums.module';
import { StoriesModule } from '../stories/stories.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [AlbumsModule, StoriesModule],
})
export class UsersModule {}
