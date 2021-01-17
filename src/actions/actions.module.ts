import { BullModule } from '@nestjs/bull';
import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { IgModule } from 'src/ig/ig.module';
import { OutboxModule } from 'src/outbox/outbox.module';
import { S3Module } from 'src/s3/s3.module';
import { ActionsClient } from './api/actions.api.client';
import actionsApiConfiguration from './api/actions.api.configuration';
import { ActionsController } from './api/actions.controller';
import { ActionsQueue } from './queue/actions.queue';
import { ACTIONS_QUEUE } from './queue/actions.queue.constants';
import { ActionsQueueProcessor } from './queue/actions.queue.processor';

@Module({
  exports: [ActionsQueue, ActionsClient],
  providers: [ActionsQueue, ActionsClient, ActionsQueueProcessor],
  controllers: [ActionsController],
  imports: [
    forwardRef(() => OutboxModule),
    ConfigModule.forFeature(actionsApiConfiguration),
    HttpModule.registerAsync({
      inject: [actionsApiConfiguration.KEY],
      imports: [ConfigModule.forFeature(actionsApiConfiguration)],
      useFactory: (config: ConfigType<typeof actionsApiConfiguration>) => {
        return {
          headers: {
            ['X-Api-Key']: config.apiKey,
          },
        };
      },
    }),
    S3Module,
    IgModule,
    BullModule.registerQueue({
      name: ACTIONS_QUEUE,
    }),
  ],
})
export class ActionsModule {}
