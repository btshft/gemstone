import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/services/prisma.module';
import { ActionsModule } from 'src/actions/actions.module';
import {
  OutboxProcessorResolver,
  OutboxTaskProcessor,
} from './outbox.processors';
import { OutboxScheduler } from './outbox.scheduler';
import { OutboxWriter } from './outbox.writer';

@Module({
  providers: [
    OutboxScheduler,
    OutboxWriter,
    OutboxProcessorResolver,
    OutboxTaskProcessor,
  ],
  imports: [forwardRef(() => ActionsModule), PrismaModule],
  exports: [OutboxWriter],
})
export class OutboxModule {}
