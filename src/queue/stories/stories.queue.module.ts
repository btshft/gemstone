import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { StoriesQueue } from './stories.queue';
import { STORIES_QUEUE } from './stories.queue.constants';
import { StoriesQueueProcessor } from './stories.queue.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: STORIES_QUEUE,
    }),
  ],
  providers: [StoriesQueueProcessor, StoriesQueue],
  exports: [StoriesQueue],
})
export class StoriesQueueModule {}
