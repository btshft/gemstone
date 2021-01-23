import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { BackoffOptions, Queue } from 'bull';
import {
  SAGA_QUEUE_NAME,
  SAGA_QUEUE_REPROCESS_ATTEMPTS,
  SAGA_QUEUE_REPROCESS_DELAY_MS,
} from './saga.queue.constants';
import { SagaJobPayload, SagaTypes, SAGA_PROCESS_REQUEST } from '../saga.types';

@Injectable()
export class SagaQueueClient {
  constructor(
    @InjectQueue(SAGA_QUEUE_NAME)
    private queue: Queue<SagaJobPayload<SagaTypes>>,
  ) {}

  async send(request: SagaJobPayload<SagaTypes>): Promise<void> {
    await this.queue.add(SAGA_PROCESS_REQUEST, request, {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: SAGA_QUEUE_REPROCESS_ATTEMPTS,
      backoff: <BackoffOptions>{
        type: 'exponential',
        delay: SAGA_QUEUE_REPROCESS_DELAY_MS,
      },
    });
  }
}
