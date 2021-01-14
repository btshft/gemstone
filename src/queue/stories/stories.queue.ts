import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { BackoffOptions, Queue } from 'bull';
import { STORIES_QUEUE } from './stories.queue.constants';
import { StoriesRequest } from './stories.queue.request';
import { StoriesTask } from './stories.task';

@Injectable()
export class StoriesQueue {
  private readonly taskStore: Map<
    string,
    Record<string, StoriesTask<StoriesRequest>>
  > = new Map();

  constructor(@InjectQueue(STORIES_QUEUE) private queue: Queue) {}

  async request(request: StoriesRequest): Promise<void> {
    const job = await this.queue.add(request, {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 5,
      backoff: <BackoffOptions>{
        type: 'exponential',
        delay: 60000,
      },
    });

    const key = `${request.tg.chatId}:${request.tg.userId}`;
    const tasks = this.taskStore.get(key) || {};
    const task = new StoriesTask<StoriesRequest>({
      jobId: job.id,
      name: `Load @${request.ig.username} stories`,
      request: request,
    });

    tasks[job.id] = task;

    this.taskStore.set(key, tasks);
  }

  tasks(chatId: number, userId: number): StoriesTask<StoriesRequest>[] {
    const key = `${chatId}:${userId}`;
    const tasks = this.taskStore.get(key);
    if (!tasks) {
      return [];
    }

    return Object.entries(tasks).map(([, v]) => v);
  }

  complete(chatId: number, userId: number, jobId: number | string) {
    const key = `${chatId}:${userId}`;
    const tasks = this.taskStore.get(key);
    if (tasks && jobId in tasks) {
      delete tasks[jobId];
    }
  }
}
