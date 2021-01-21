import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/services/prisma.module';
import { OutboxModule } from 'src/outbox/outbox.module';
import { SagaQueueClient } from './queue/saga.queue.client';
import { SAGA_QUEUE_NAME } from './queue/saga.queue.constants';
import { SagaQueueProcessor } from './queue/saga.queue.processor';
import { SagaService } from './saga.service';
import { SagaHandlerResolver } from './queue/saga.queue.handler.resolver';
import { IgGetJsonHandler } from './stories/request/ig-get-json.handler';
import { S3UploadHandler } from './stories/request/s3-upload.handler';
import { TgSendHandler } from './stories/request/tg-send.handler';
import { IgModule } from 'src/ig/ig.module';
import { S3Module } from 'src/s3/s3.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  providers: [
    SagaQueueClient,
    SagaHandlerResolver,
    IgGetJsonHandler,
    S3UploadHandler,
    TgSendHandler,
    SagaService,
    SagaQueueProcessor,
  ],
  exports: [SagaQueueClient, SagaService],
  imports: [
    forwardRef(() => OutboxModule),
    S3Module,
    IgModule,
    PrismaModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: SAGA_QUEUE_NAME,
    }),
  ],
})
export class SagaModule {}
