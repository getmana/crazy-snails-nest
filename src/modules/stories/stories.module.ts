import { Module } from '@nestjs/common';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { SharedModule } from '../shared/users/shared.module';
import { UserStoriesController } from './user-stories.controller';

@Module({
  controllers: [StoriesController, UserStoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
  imports: [SharedModule],
})
export class StoriesModule {}
