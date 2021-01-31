import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/services/prisma.module';
import { OutboxModule } from 'src/outbox/outbox.module';
import { SagaQueueClient } from './queue/saga.queue.client';
import { SAGA_QUEUE_NAME } from './queue/saga.queue.constants';
import { SagaQueueProcessor } from './queue/saga.queue.processor';
import { SagaService } from './saga.service';
import { SagaHandlerResolver } from './queue/saga.queue.handler.resolver';
import { IgGetJsonHandler } from './stories/request/handlers/ig-get-json.handler';
import { S3UploadHandler } from './stories/request/handlers/s3-upload.handler';
import { TgSendHandler } from './stories/request/handlers/tg-send.handler';
import { IgModule } from 'src/ig/ig.module';
import { S3Module } from 'src/s3/s3.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { IgGetFollowersHandler } from './insight/followers/handlers/ig-get-followers.handler';
import { SendFollowersInsightHandler } from './insight/followers/handlers/send-followers-insight.handler';
import { GenerateFollowersInsightHandler } from './insight/followers/handlers/generate-followers-insight.handler';
import { InsightModule } from 'src/insight/insight.module';
import { TtModule } from 'src/tt/tt.module';
import { TtS3UploadHandler } from './tt/handlers/tt.s3-upload.handler';
import { TtTgSendHandler } from './tt/handlers/tt.tg-send.handler';

@Module({
  providers: [
    SagaQueueClient,
    SagaHandlerResolver,
    ...[IgGetJsonHandler, S3UploadHandler, TgSendHandler],
    ...[
      IgGetFollowersHandler,
      SendFollowersInsightHandler,
      GenerateFollowersInsightHandler,
    ],
    ...[TtS3UploadHandler, TtTgSendHandler],
    SagaService,
    SagaQueueProcessor,
  ],
  exports: [SagaQueueClient, SagaService],
  imports: [
    forwardRef(() => OutboxModule),
    S3Module,
    IgModule,
    TtModule,
    PrismaModule,
    NotificationsModule,
    InsightModule,
    BullModule.registerQueue({
      name: SAGA_QUEUE_NAME,
    }),
  ],
})
export class SagaModule {}
