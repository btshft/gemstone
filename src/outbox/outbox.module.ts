import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/services/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { SagaModule } from 'src/sagas/saga.module';
import {
  NotificationsProcessor,
  OutboxProcessorResolver,
  OutboxSagaProcessor,
} from './outbox.processors';
import { OutboxScheduler } from './outbox.scheduler';
import { OutboxWriter } from './outbox.writer';

@Module({
  providers: [
    OutboxScheduler,
    OutboxWriter,
    OutboxProcessorResolver,
    OutboxSagaProcessor,
    NotificationsProcessor,
  ],
  imports: [
    PrismaModule,
    forwardRef(() => SagaModule),
    forwardRef(() => NotificationsModule),
  ],
  exports: [OutboxWriter],
})
export class OutboxModule {}
