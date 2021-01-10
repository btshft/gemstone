import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfiguration from './app.configuration';
import botConfiguration from './bot/bot.configuration';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    BotModule,
    ConfigModule.forRoot({
      load: [botConfiguration, appConfiguration],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
