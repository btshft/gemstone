import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { STORIES_LOAD_QUEUE } from './stories-load.constants';
import { StoriesLoadQueue } from './stories-load.queue';
import { StoriesLoadProcessor } from './stories-load.queue-processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: STORIES_LOAD_QUEUE,
    }),
  ],
  providers: [StoriesLoadProcessor, StoriesLoadQueue],
  exports: [StoriesLoadQueue],
})
export class StoriesLoadModule {}
