import { BullModule } from '@nestjs/bull';
import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { PrismaModule } from 'src/database/services/prisma.module';
import { OutboxModule } from 'src/outbox/outbox.module';
import { SagaClient } from './api/sagas.api.client';
import sagasApiConfiguration from './api/sagas.api.configuration';
import { SagasController } from './api/sagas.controller';
import { SagaQueueClient } from './queue/saga.queue.client';
import { SAGA_QUEUE_NAME } from './queue/saga.queue.constants';
import { SagaQueueProcessor } from './queue/saga.queue.processor';
import { SagaService } from './saga.service';
import { SagaHandlerResolver } from './queue/saga.queue.handler.resolver';
import { IgGetJsonHandler } from './stories-request/ig-get-json.handler';
import { S3UploadHandler } from './stories-request/s3-upload.handler';
import { TgSendHandler } from './stories-request/tg-send.handler';

@Module({
  controllers: [SagasController],
  providers: [
    SagaQueueClient,
    SagaClient,
    SagaHandlerResolver,
    IgGetJsonHandler,
    S3UploadHandler,
    TgSendHandler,
    SagaService,
    SagaQueueProcessor,
  ],
  exports: [SagaQueueClient, SagaClient],
  imports: [
    forwardRef(() => OutboxModule),
    PrismaModule,
    ConfigModule.forFeature(sagasApiConfiguration),
    BullModule.registerQueue({
      name: SAGA_QUEUE_NAME,
    }),
    HttpModule.registerAsync({
      imports: [ConfigModule.forFeature(sagasApiConfiguration)],
      inject: [sagasApiConfiguration.KEY],
      useFactory(config: ConfigType<typeof sagasApiConfiguration>) {
        return {
          baseURL: config.apiBaseUrl,
          headers: {
            ['X-Api-Key']: config.apiKey,
          },
        };
      },
    }),
  ],
})
export class SagaModule {}
