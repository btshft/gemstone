import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import appConfiguration from './app.configuration';
import botConfiguration from './bot/bot.configuration';
import { BotModule } from './bot/bot.module';
import { HealthModule } from './health/health.module';
import { IgModule } from './ig/ig.module';
import { ProtectorModule } from './protector/protector.module';
import { InsightModule } from './insight/insight.module';
import { SagaModule } from './sagas/saga.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [botConfiguration, appConfiguration],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule.forFeature(appConfiguration)],
      useFactory: (config: ConfigType<typeof appConfiguration>) => ({
        prefix: config.queue.prefix,
        redis: {
          host: config.queue.host,
          port: config.queue.port,
          password: config.queue.password,
          keyPrefix: config.queue.prefix,
        },
      }),
      inject: [appConfiguration.KEY],
    }),
    ScheduleModule.forRoot(),
    BotModule,
    IgModule,
    StoreModule,
    ProtectorModule,
    HealthModule,
    SagaModule,
    InsightModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
