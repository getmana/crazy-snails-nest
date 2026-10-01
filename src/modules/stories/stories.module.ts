import { Module } from '@nestjs/common';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { SharedModule } from '../shared/users/shared.module';

@Module({
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
  imports: [SharedModule],
})
export class StoriesModule {}
