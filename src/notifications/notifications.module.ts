import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { OutboxModule } from 'src/outbox/outbox.module';
import { NotificationsQueueClient } from './notifications.queue.client';
import { NotificationsQueueProcessor } from './notifications.queue.processor';
import { NOTIFICATIONS_QUEUE_NAME } from './notifications.queue.types';

@Module({
  exports: [NotificationsQueueClient],
  providers: [NotificationsQueueClient, NotificationsQueueProcessor],
  imports: [
    forwardRef(() => OutboxModule),
    BullModule.registerQueue({
      name: NOTIFICATIONS_QUEUE_NAME,
    }),
  ],
})
export class NotificationsModule {}
