import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { BackoffOptions, Queue } from 'bull';
import { TaskStore } from 'src/tasks/task.store';
import {
  STORIES_QUEUE,
  STORIES_QUEUE_REPROCESS_ATTEMPTS,
  STORIES_QUEUE_REPROCESS_DELAY_MS,
} from './stories.queue.constants';
import { LoadStoriesRequest, StoriesTask } from './stories.queue.types';

@Injectable()
export class StoriesQueue {
  constructor(
    @InjectQueue(STORIES_QUEUE) private queue: Queue,
    private tasks: TaskStore,
  ) {}

  // eslint-disable-next-line prettier/prettier
  async request(request: LoadStoriesRequest): Promise<StoriesTask<'stories:request'>> {
    const job = await this.queue.add(request, {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: STORIES_QUEUE_REPROCESS_ATTEMPTS,
      backoff: <BackoffOptions>{
        type: 'exponential',
        delay: STORIES_QUEUE_REPROCESS_DELAY_MS,
      },
    });

    return this.tasks.create<StoriesTask<'stories:request'>>({
      key: String(job.id),
      status: 'created',
      region: `${request.tg.chatId}:${request.tg.userId}`,
      text: `Loading '${request.ig.username}' stories`,
      extension: {
        request: request,
        job: {
          id: job.id,
        },
      },
    });
  }
}
