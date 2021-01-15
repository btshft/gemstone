import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { BackoffOptions, Queue } from 'bull';
import {
  CALLBACK_QUEUE,
  CALLBACK_QUEUE_REPROCESS_ATTEMPTS,
  CALLBACK_QUEUE_REPROCESS_DELAY_MS,
} from './callback.queue.constants';
import { Callback } from './callback.types';

@Injectable()
export class CallbackQueue {
  constructor(@InjectQueue(CALLBACK_QUEUE) private queue: Queue) {}

  async submit(callback: Callback<'stories:req:ready'>): Promise<void> {
    await this.queue.add(callback.type, callback.payload, {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: CALLBACK_QUEUE_REPROCESS_ATTEMPTS,
      backoff: <BackoffOptions>{
        type: 'exponential',
        delay: CALLBACK_QUEUE_REPROCESS_DELAY_MS,
      },
    });
  }
}
