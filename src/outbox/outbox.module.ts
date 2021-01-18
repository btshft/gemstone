import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/services/prisma.module';
import { SagaModule } from 'src/sagas/saga.module';
import {
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
  ],
  imports: [PrismaModule, forwardRef(() => SagaModule)],
  exports: [OutboxWriter],
})
export class OutboxModule {}
