import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { STORIES_LOAD_QUEUE } from './stories-load.constants';
import { LoadStoriesRequest } from './stories-load.message';

@Injectable()
export class StoriesLoadQueue {
  constructor(
    @InjectQueue(STORIES_LOAD_QUEUE) private queue: Queue<LoadStoriesRequest>,
  ) {}

  public async request(payload: LoadStoriesRequest): Promise<void> {
    await this.queue.add(payload);
  }
}
