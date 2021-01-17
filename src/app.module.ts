import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ActionsModule } from './actions/actions.module';
import appConfiguration from './app.configuration';
import botConfiguration from './bot/bot.configuration';
import { BotModule } from './bot/bot.module';
import { HealthModule } from './health/health.module';
import { IgModule } from './ig/ig.module';
import { ProtectorModule } from './protector/protector.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [botConfiguration, appConfiguration],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule.forFeature(appConfiguration)],
      useFactory: (config: ConfigType<typeof appConfiguration>) => ({
        redis: {
          host: config.queue.host,
          port: config.queue.port,
          password: config.queue.password,
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
    ActionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
