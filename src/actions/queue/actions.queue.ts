import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { BackoffOptions, Queue } from 'bull';
import {
  ACTIONS_QUEUE,
  ACTIONS_QUEUE_REPROCESS_ATTEMPTS,
  ACTIONS_QUEUE_REPROCESS_DELAY_MS,
} from './actions.queue.constants';
import { Action, ActionTypes } from '../actions.types';

@Injectable()
export class ActionsQueue {
  constructor(@InjectQueue(ACTIONS_QUEUE) private queue: Queue) {}

  async request<TKey extends ActionTypes>(task: Action<TKey>): Promise<void> {
    await this.queue.add(task.type, task.payload, {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: ACTIONS_QUEUE_REPROCESS_ATTEMPTS,
      backoff: <BackoffOptions>{
        type: 'exponential',
        delay: ACTIONS_QUEUE_REPROCESS_DELAY_MS,
      },
    });
  }
}
