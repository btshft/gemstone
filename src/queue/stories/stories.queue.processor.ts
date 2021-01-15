import { Process, Processor } from '@nestjs/bull';
import { STORIES_QUEUE } from './stories.queue.constants';

@Processor(STORIES_QUEUE)
export class StoriesQueueProcessor {
  constructor() {}

  @Process()
  async process(): Promise<void> {}
}
