import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { BackoffOptions, Queue } from 'bull';
import {
  NOTIFICATIONS_QUEUE_NAME,
  NOTIFICATIONS_QUEUE_REPROCESS_ATTEMPTS,
  NOTIFICATIONS_QUEUE_REPROCESS_DELAY_MS,
  UserNotification,
} from './notifications.queue.types';

@Injectable()
export class NotificationsQueueClient {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE_NAME)
    private readonly queue: Queue<UserNotification>,
  ) {}

  async send(notification: UserNotification): Promise<void> {
    await this.queue.add(notification, {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: NOTIFICATIONS_QUEUE_REPROCESS_ATTEMPTS,
      backoff: <BackoffOptions>{
        type: 'exponential',
        delay: NOTIFICATIONS_QUEUE_REPROCESS_DELAY_MS,
      },
    });
  }
}
